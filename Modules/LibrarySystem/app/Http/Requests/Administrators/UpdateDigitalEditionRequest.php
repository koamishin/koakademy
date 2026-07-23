<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Requests\Administrators;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\LibrarySystem\Enums\DigitalEditionStatus;
use Modules\LibrarySystem\Enums\DigitalRightsBasis;
use Modules\LibrarySystem\Models\Book;

final class UpdateDigitalEditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $book = $this->route('book');

        return $book instanceof Book
            && ($this->user()?->can('manageDigitalEdition', $book) ?? false);
    }

    public function rules(): array
    {
        $publishing = $this->string('status')->toString() === DigitalEditionStatus::Published->value;

        return [
            'status' => ['required', Rule::enum(DigitalEditionStatus::class)],
            'downloads_allowed' => ['required', 'boolean'],
            'rights_basis' => [
                Rule::requiredIf($publishing),
                'nullable',
                Rule::enum(DigitalRightsBasis::class),
            ],
            'rights_holder' => ['nullable', 'string', 'max:255'],
            'license_url' => ['nullable', 'url:http,https', 'max:2048'],
            'rights_notes' => ['nullable', 'string', 'max:5000'],
            'rights_expires_at' => ['nullable', 'date', 'after:today'],
            'rights_confirmed' => $publishing
                ? ['required', 'accepted']
                : ['nullable', 'boolean'],
        ];
    }
}
