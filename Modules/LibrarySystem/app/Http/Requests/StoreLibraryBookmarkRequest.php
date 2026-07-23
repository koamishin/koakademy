<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreLibraryBookmarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'page' => ['required', 'integer', 'min:1', 'max:100000'],
            'label' => ['nullable', 'string', 'max:100'],
        ];
    }
}
