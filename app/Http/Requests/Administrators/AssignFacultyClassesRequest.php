<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use Illuminate\Foundation\Http\FormRequest;

final class AssignFacultyClassesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'class_ids' => ['required', 'array', 'min:1'],
            'class_ids.*' => ['integer', 'distinct', 'exists:classes,id'],
            'allow_reassignment' => ['sometimes', 'boolean'],
            'notify_faculty' => ['sometimes', 'boolean'],
        ];
    }
}
