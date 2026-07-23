<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateReadingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'last_page' => ['required', 'integer', 'min:1', 'lte:total_pages'],
            'total_pages' => ['required', 'integer', 'min:1', 'max:100000'],
        ];
    }
}
