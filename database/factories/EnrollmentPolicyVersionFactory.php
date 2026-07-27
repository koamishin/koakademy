<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enrollment\EnrollmentPolicyPreset;
use App\Models\EnrollmentPolicy;
use App\Models\EnrollmentPolicyVersion;
use Illuminate\Database\Eloquent\Factories\Factory;
use Override;

/** @extends Factory<EnrollmentPolicyVersion> */
final class EnrollmentPolicyVersionFactory extends Factory
{
    #[Override]
    protected $model = EnrollmentPolicyVersion::class;

    public function definition(): array
    {
        return ['enrollment_policy_id' => EnrollmentPolicy::factory(), 'version' => 1, 'state' => 'draft', 'schema_version' => 1, 'configuration' => EnrollmentPolicyPreset::standard()];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes): array => ['state' => 'published', 'checksum' => hash('sha256', json_encode($attributes['configuration'] ?? [], JSON_THROW_ON_ERROR)), 'published_at' => now()]);
    }
}
