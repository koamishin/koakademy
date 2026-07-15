<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enrollment\EnrollmentPolicyPreset;
use App\Models\EnrollmentPolicySnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EnrollmentPolicySnapshot> */
final class EnrollmentPolicySnapshotFactory extends Factory
{
    protected $model = EnrollmentPolicySnapshot::class;

    public function definition(): array
    {
        $configuration = EnrollmentPolicyPreset::standard();

        return ['schema_version' => 1, 'checksum' => fake()->unique()->sha256(), 'configuration' => $configuration, 'source_version_ids' => []];
    }
}
