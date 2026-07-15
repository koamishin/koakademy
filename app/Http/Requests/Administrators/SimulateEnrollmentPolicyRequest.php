<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Enums\StudentType;
use App\Models\GeneralSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class SimulateEnrollmentPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewEnrollmentPipeline', GeneralSetting::class) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'student_enrollment_id' => ['nullable', 'integer', 'exists:student_enrollment,id'],
            'school_id' => ['required_without:student_enrollment_id', 'nullable', 'integer', 'exists:schools,id'],
            'student_type' => ['required_without:student_enrollment_id', 'nullable', Rule::enum(StudentType::class)],
            'course_id' => ['required_without:student_enrollment_id', 'nullable', 'integer', 'exists:courses,id'],
            'school_year' => ['required_without:student_enrollment_id', 'nullable', 'string', 'max:30'],
            'semester' => ['required_without:student_enrollment_id', 'nullable', 'integer', 'between:1,3'],
            'year_level' => ['nullable', 'integer', 'between:1,12'],
            'channel' => ['required', 'string', Rule::in(['public', 'administrator', 'continuing', 'api'])],
            'facts' => ['nullable', 'array'],
        ];
    }
}
