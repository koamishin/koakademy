<?php

declare(strict_types=1);

namespace App\Http\Requests\Administrators;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class StoreEnrollmentDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->canAccessAdminPortal();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'normalized_name' => ['required', 'string', Rule::unique('enrollment_discounts', 'normalized_name')],
            'percentage' => ['required', 'integer', 'between:1,100'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'normalized_name.unique' => 'A discount with this name already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = Str::squish((string) $this->input('name'));

        $this->merge([
            'name' => $name,
            'normalized_name' => Str::lower($name),
        ]);
    }
}
