<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\EnrollmentWorkflowEvent;
use App\Models\StudentEnrollment;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EnrollmentWorkflowEvent> */
final class EnrollmentWorkflowEventFactory extends Factory
{
    protected $model = EnrollmentWorkflowEvent::class;

    public function definition(): array
    {
        return ['student_enrollment_id' => StudentEnrollment::factory(), 'event_type' => 'transition_succeeded', 'result' => []];
    }
}
