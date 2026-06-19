<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Student;

final class StudentProfileCompletionService
{
    /**
     * @return array{total: int, completed: int, percentage: int, missing: array<int, array{key: string, label: string, section: string, example?: string}>}
     */
    public function summarize(?Student $student): array
    {
        if (! $student instanceof Student) {
            return [
                'total' => 0,
                'completed' => 0,
                'percentage' => 0,
                'missing' => [],
            ];
        }

        $student->loadMissing(['studentContactsInfo', 'studentEducationInfo', 'studentParentInfo']);

        $fields = $this->fields($student);
        $missing = collect($fields)
            ->filter(fn (array $field): bool => ! $this->filled($field['value'] ?? null))
            ->map(fn (array $field): array => array_filter([
                'key' => $field['key'],
                'label' => $field['label'],
                'section' => $field['section'],
                'example' => $field['example'] ?? null,
            ], static fn (mixed $value): bool => $value !== null))
            ->values()
            ->all();

        $total = count($fields);
        $completed = $total - count($missing);

        return [
            'total' => $total,
            'completed' => $completed,
            'percentage' => $total === 0 ? 0 : (int) round(($completed / $total) * 100),
            'missing' => $missing,
        ];
    }

    /**
     * @return array<int, array{key: string, label: string, section: string, value: mixed, example?: string}>
     */
    private function fields(Student $student): array
    {
        $contacts = $student->studentContactsInfo;
        $education = $student->studentEducationInfo;
        $parents = $student->studentParentInfo;

        return [
            ['key' => 'first_name', 'label' => 'First name', 'section' => 'student', 'value' => $student->first_name, 'example' => 'Juan'],
            ['key' => 'last_name', 'label' => 'Last name', 'section' => 'student', 'value' => $student->last_name, 'example' => 'Dela Cruz'],
            ['key' => 'email', 'label' => 'Student email', 'section' => 'student', 'value' => $student->email, 'example' => 'juan@example.com'],
            ['key' => 'phone', 'label' => 'Phone number', 'section' => 'student', 'value' => $student->phone, 'example' => '+63 912 345 6789'],
            ['key' => 'address', 'label' => 'Home address', 'section' => 'student', 'value' => $student->address, 'example' => 'Davao City, Davao del Sur'],
            ['key' => 'birth_date', 'label' => 'Birth date', 'section' => 'student', 'value' => $student->birth_date],
            ['key' => 'gender', 'label' => 'Gender', 'section' => 'student', 'value' => $student->gender],
            ['key' => 'civil_status', 'label' => 'Civil status', 'section' => 'student', 'value' => $student->civil_status],
            ['key' => 'nationality', 'label' => 'Nationality', 'section' => 'student', 'value' => $student->nationality, 'example' => 'Filipino'],
            ['key' => 'emergency_contact', 'label' => 'Emergency contact summary', 'section' => 'student', 'value' => $student->emergency_contact, 'example' => 'Juan Dela Cruz - 09123456789'],
            ['key' => 'contacts.emergency_contact_name', 'label' => 'Emergency contact name', 'section' => 'contacts', 'value' => $contacts?->emergency_contact_name, 'example' => 'Maria Dela Cruz'],
            ['key' => 'contacts.emergency_contact_phone', 'label' => 'Emergency contact phone', 'section' => 'contacts', 'value' => $contacts?->emergency_contact_phone, 'example' => '09123456789'],
            ['key' => 'contacts.emergency_contact_relationship', 'label' => 'Emergency contact relationship', 'section' => 'contacts', 'value' => $contacts?->emergency_contact_relationship, 'example' => 'Mother'],
            ['key' => 'contacts.personal_contact', 'label' => 'Personal contact', 'section' => 'contacts', 'value' => $contacts?->personal_contact, 'example' => '+63 912 345 6789'],
            ['key' => 'parents.father_name', 'label' => 'Father name', 'section' => 'contacts', 'value' => $parents?->father_name ?? $parents?->fathers_name, 'example' => 'Pedro Dela Cruz'],
            ['key' => 'parents.mother_name', 'label' => 'Mother name', 'section' => 'contacts', 'value' => $parents?->mother_name ?? $parents?->mothers_name, 'example' => 'Maria Dela Cruz'],
            ['key' => 'education.elementary_school', 'label' => 'Elementary school', 'section' => 'education', 'value' => $education?->elementary_school],
            ['key' => 'education.elementary_year_graduated', 'label' => 'Elementary year graduated', 'section' => 'education', 'value' => $education?->elementary_year_graduated ?? $education?->elementary_graduate_year, 'example' => '2016'],
            ['key' => 'education.high_school', 'label' => 'High school', 'section' => 'education', 'value' => $education?->high_school ?? $education?->junior_high_school_name],
            ['key' => 'education.high_school_year_graduated', 'label' => 'High school year graduated', 'section' => 'education', 'value' => $education?->high_school_year_graduated ?? $education?->junior_high_graduation_year, 'example' => '2020'],
            ['key' => 'education.senior_high_school', 'label' => 'Senior high school', 'section' => 'education', 'value' => $education?->senior_high_school ?? $education?->senior_high_name],
            ['key' => 'education.senior_high_year_graduated', 'label' => 'Senior high year graduated', 'section' => 'education', 'value' => $education?->senior_high_year_graduated ?? $education?->senior_high_graduate_year, 'example' => '2022'],
        ];
    }

    private function filled(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        if (is_string($value)) {
            return mb_trim($value) !== '';
        }

        return true;
    }
}
