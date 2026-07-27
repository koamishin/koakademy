<?php

declare(strict_types=1);

namespace App\Enrollment;

use App\Data\Enrollment\CompiledEnrollmentPolicy;
use App\Models\EnrollmentPolicy;
use App\Models\EnrollmentPolicyVersion;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final readonly class EnrollmentPolicyInheritanceService
{
    private const array ScopeFields = [
        'school_id',
        'student_type',
        'course_id',
        'school_year',
        'semester',
    ];

    public function __construct(private EnrollmentPolicyCompiler $compiler) {}

    /**
     * @param  array<string, mixed>  $scope
     * @param  array<string, mixed>  $localConfiguration
     */
    public function compileForScope(array $scope, array $localConfiguration, ?EnrollmentPolicy $exclude = null): CompiledEnrollmentPolicy
    {
        $layers = $this->ancestorLayers($scope, $exclude);
        $layers[] = [
            'version_id' => 0,
            'policy_id' => $exclude?->id,
            'policy_name' => $exclude?->name ?? 'Current draft',
            'scope' => $this->scopeLabels($scope),
            'configuration' => $localConfiguration,
        ];

        return $this->compiler->compile($layers);
    }

    /** @param array<string, mixed> $localConfiguration */
    public function compileForPolicy(EnrollmentPolicy $policy, array $localConfiguration): CompiledEnrollmentPolicy
    {
        return $this->compileForScope($this->scopeFromPolicy($policy), $localConfiguration, $policy);
    }

    /** @return array<string, mixed> */
    public function describe(EnrollmentPolicy $policy): array
    {
        $layers = $this->ancestorLayers($this->scopeFromPolicy($policy), $policy);

        if ($layers === []) {
            return [
                'configuration' => null,
                'layers' => [],
                'source_map' => [],
            ];
        }

        $compiled = $this->compiler->compile($layers);

        return [
            'configuration' => $compiled->configuration,
            'layers' => $compiled->sourceLayers,
            'source_map' => $compiled->sourceMap,
        ];
    }

    /** @param array<string, mixed> $scope */
    public function hasPublishedGlobalPolicy(array $scope = []): bool
    {
        if ($this->ancestors($scope)
            ->contains(fn (EnrollmentPolicy $policy): bool => $this->specificity($this->scopeFromPolicy($policy)) === 0)) {
            return true;
        }

        return (bool) EnrollmentPolicy::query()
            ->enabled()
            ->where('scope_key', EnrollmentPolicy::scopeKey([]))
            ->whereNotNull('active_version_id')
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $scope
     * @return array<int, array<string, mixed>>
     */
    private function ancestorLayers(array $scope, ?EnrollmentPolicy $exclude = null): array
    {
        return $this->ancestors($scope, $exclude)
            ->map(fn (EnrollmentPolicy $policy): array => $this->layer($policy))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $scope
     * @return Collection<int, EnrollmentPolicy>
     */
    private function ancestors(array $scope, ?EnrollmentPolicy $exclude = null): Collection
    {
        $specificity = $this->specificity($scope);

        return EnrollmentPolicy::query()
            ->enabled()
            ->with(['activeVersion', 'school:id,name', 'course:id,code,title'])
            ->when($exclude, fn ($query) => $query->whereKeyNot($exclude->getKey()))
            ->get()
            ->filter(function (EnrollmentPolicy $candidate) use ($scope, $specificity): bool {
                $candidateScope = $this->scopeFromPolicy($candidate);
                if ($this->specificity($candidateScope) >= $specificity) {
                    return false;
                }

                foreach (self::ScopeFields as $field) {
                    if ($candidateScope[$field] !== null && $candidateScope[$field] !== ($scope[$field] ?? null)) {
                        return false;
                    }
                }

                return $candidate->activeVersion instanceof EnrollmentPolicyVersion;
            })
            ->sortBy(fn (EnrollmentPolicy $policy): string => $this->precedenceKey($policy))
            ->values();
    }

    /** @return array<string, mixed> */
    private function layer(EnrollmentPolicy $policy): array
    {
        $version = $policy->activeVersion;
        if (! $version instanceof EnrollmentPolicyVersion) {
            throw ValidationException::withMessages(['policy' => 'An inherited policy is missing its active version.']);
        }

        return [
            'version_id' => $version->id,
            'version' => $version->version,
            'policy_id' => $policy->id,
            'policy_name' => $policy->name,
            'scope' => $policy->scopeLabels(),
            'configuration' => $version->configuration,
        ];
    }

    /** @return array<string, mixed> */
    private function scopeFromPolicy(EnrollmentPolicy $policy): array
    {
        return [
            'school_id' => $policy->school_id,
            'student_type' => $policy->student_type,
            'course_id' => $policy->course_id,
            'school_year' => $policy->school_year,
            'semester' => $policy->semester,
        ];
    }

    /** @param array<string, mixed> $scope */
    private function specificity(array $scope): int
    {
        return collect(self::ScopeFields)->filter(fn (string $field): bool => ($scope[$field] ?? null) !== null)->count();
    }

    private function precedenceKey(EnrollmentPolicy $policy): string
    {
        $period = (int) ($policy->school_year !== null) + (int) ($policy->semester !== null);

        return sprintf(
            '%02d|%d|%d|%d|%d|%020d',
            $this->specificity($this->scopeFromPolicy($policy)),
            $period,
            (int) ($policy->course_id !== null),
            (int) ($policy->student_type !== null),
            (int) ($policy->school_id !== null),
            $policy->id,
        );
    }

    /** @param array<string, mixed> $scope @return array<string, string> */
    private function scopeLabels(array $scope): array
    {
        return array_filter([
            'school' => isset($scope['school_id']) ? (string) $scope['school_id'] : null,
            'student_type' => isset($scope['student_type']) ? (string) $scope['student_type'] : null,
            'program' => isset($scope['course_id']) ? (string) $scope['course_id'] : null,
            'school_year' => isset($scope['school_year']) ? (string) $scope['school_year'] : null,
            'semester' => isset($scope['semester']) ? (string) $scope['semester'] : null,
        ], fn (?string $value): bool => $value !== null && $value !== '');
    }
}
