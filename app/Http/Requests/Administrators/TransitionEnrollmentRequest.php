<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Models\StudentEnrollment;
use Illuminate\Foundation\Http\FormRequest;

final class TransitionEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $enrollment = $this->route('enrollment');

        return $enrollment instanceof StudentEnrollment && $this->user()?->can('update', $enrollment) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'transition_key' => ['nullable', 'string', 'max:80'],
            'idempotency_key' => ['required', 'string', 'max:96'],
            'payload' => ['nullable', 'array'],
        ];
    }
}
