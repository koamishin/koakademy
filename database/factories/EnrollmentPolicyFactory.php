<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\EnrollmentPolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EnrollmentPolicy> */
final class EnrollmentPolicyFactory extends Factory
{
    protected $model = EnrollmentPolicy::class;

    public function definition(): array
    {
        $scope = [
            'school_id' => null,
            'student_type' => null,
            'course_id' => null,
            'school_year' => 'test-'.fake()->unique()->uuid(),
            'semester' => null,
        ];

        return ['name' => fake()->unique()->words(3, true), ...$scope, 'scope_key' => EnrollmentPolicy::scopeKey($scope), 'is_enabled' => true];
    }

    public function global(): static
    {
        $scope = ['school_id' => null, 'student_type' => null, 'course_id' => null, 'school_year' => null, 'semester' => null];

        return $this->state(['school_year' => null, 'scope_key' => EnrollmentPolicy::scopeKey($scope)]);
    }
}
