<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ManageFacultyPortalAccountRequest extends FormRequest
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
            'mode' => ['required', Rule::in(['create', 'repair'])],
            'role' => [
                'required',
                Rule::in([
                    UserRole::Professor->value,
                    UserRole::AssociateProfessor->value,
                    UserRole::AssistantProfessor->value,
                    UserRole::Instructor->value,
                    UserRole::PartTimeFaculty->value,
                ]),
            ],
            'send_reset_link' => ['sometimes', 'boolean'],
        ];
    }
}
