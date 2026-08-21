<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use Illuminate\Foundation\Http\FormRequest;

final class ListTuitionAdjustmentRowsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('view_tuition_fees') ?? false;
    }

    public function rules(): array
    {
        return [
            'school_year' => ['nullable', 'string', 'max:30'],
            'semester' => ['nullable', 'integer', 'in:1,2'],
            'enrollment' => ['nullable', 'integer'],
            'student' => ['nullable', 'integer'],
            'course_id' => ['nullable', 'integer'],
        ];
    }
}
