<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Models\GeneralSetting;
use Illuminate\Foundation\Http\FormRequest;

final class RollbackEnrollmentPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('updateEnrollmentPipeline', GeneralSetting::class) === true;
    }

    public function rules(): array
    {
        return ['confirmation' => ['required', 'in:rollback']];
    }
}
