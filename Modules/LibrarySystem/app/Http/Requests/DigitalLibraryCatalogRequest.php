<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class DigitalLibraryCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'category_id' => ['nullable', 'integer', 'exists:library_categories,id'],
            'year' => ['nullable', 'integer', 'min:1500', 'max:2100'],
            'availability' => ['nullable', Rule::in(['all', 'online', 'catalog'])],
            'collection' => ['nullable', Rule::in(['all', 'favorites', 'recent'])],
            'sort' => ['nullable', Rule::in(['title', 'year_newest', 'year_oldest', 'recently_added'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
