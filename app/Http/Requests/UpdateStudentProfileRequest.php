<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateStudentProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStudentRole() === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $studentId = Student::query()
            ->where('user_id', $this->user()?->id)
            ->value('id');

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('students')->ignore($studentId),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'religion' => ['nullable', 'string', 'max:100'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'in:male,female,other,prefer_not_to_say'],
            'contacts.emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'contacts.emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'contacts.emergency_contact_relationship' => ['nullable', 'string', 'max:255'],
            'contacts.facebook' => ['nullable', 'string', 'max:255'],
            'contacts.personal_contact' => ['nullable', 'string', 'max:20'],
            'education.elementary_school' => ['nullable', 'string', 'max:255'],
            'education.elementary_year_graduated' => ['nullable', 'string', 'max:20'],
            'education.high_school' => ['nullable', 'string', 'max:255'],
            'education.high_school_year_graduated' => ['nullable', 'string', 'max:20'],
            'education.senior_high_school' => ['nullable', 'string', 'max:255'],
            'education.senior_high_year_graduated' => ['nullable', 'string', 'max:20'],
            'parents.father_name' => ['nullable', 'string', 'max:255'],
            'parents.mother_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'gender' => $this->normalizeGender($this->input('gender')),
        ]);
    }

    private function normalizeGender(mixed $gender): ?string
    {
        if ($gender === null || $gender === '') {
            return null;
        }

        $normalizedGender = str_replace([' ', '-'], '_', mb_strtolower(mb_trim((string) $gender)));

        return match ($normalizedGender) {
            'male', 'female', 'other', 'prefer_not_to_say' => $normalizedGender,
            default => (string) $gender,
        };
    }
}
