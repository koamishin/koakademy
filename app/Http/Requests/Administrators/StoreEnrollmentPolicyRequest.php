<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Enums\StudentType;
use App\Models\GeneralSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreEnrollmentPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateEnrollmentPipeline', GeneralSetting::class) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'school_id' => ['nullable', 'integer', 'exists:schools,id'],
            'student_type' => ['nullable', Rule::enum(StudentType::class)],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'school_year' => ['nullable', 'string', 'max:30'],
            'semester' => ['nullable', 'integer', 'between:1,3', 'required_with:school_year'],
            'configuration' => ['nullable', 'array'],
            'preset' => ['nullable', 'string', Rule::in(array_keys(\App\Enrollment\EnrollmentPolicyPreset::catalog()))],
            'inherit' => ['sometimes', 'boolean'],
            'change_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
