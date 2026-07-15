<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Models\GeneralSetting;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateEnrollmentPolicyDraftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateEnrollmentPipeline', GeneralSetting::class) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'configuration' => ['required', 'array'],
            'change_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
