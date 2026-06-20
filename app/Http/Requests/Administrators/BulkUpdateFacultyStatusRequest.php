<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class BulkUpdateFacultyStatusRequest extends FormRequest
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
            'faculty_ids' => ['required', 'array', 'min:1'],
            'faculty_ids.*' => ['string', 'distinct', 'exists:faculty,id'],
            'status' => ['required', Rule::in(['active', 'inactive', 'on_leave'])],
        ];
    }
}
