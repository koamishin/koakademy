<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Enums\SchoolLevel;
use App\Models\GeneralSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateSchoolLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateSchool', GeneralSetting::class) ?? false;
    }

    /**
     * @return array<string, array<int, string|Rule>>
     */
    public function rules(): array
    {
        return [
            'school_id' => [
                'required',
                'integer',
                Rule::exists('schools', 'id')->whereNull('deleted_at'),
            ],
            'school_level' => ['required', Rule::enum(SchoolLevel::class)],
        ];
    }
}
