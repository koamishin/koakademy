<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Requests\Administrators;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\LibrarySystem\Enums\DigitalEditionStatus;
use Modules\LibrarySystem\Enums\DigitalRightsBasis;
use Modules\LibrarySystem\Models\Book;

final class StoreDigitalEditionRequest extends FormRequest
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
            'pdf' => [
                'required',
                'file',
                'extensions:pdf',
                'mimes:pdf',
                'mimetypes:application/pdf,application/x-pdf',
                'max:'.config('librarysystem.ebooks.max_upload_kilobytes', 92160),
            ],
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

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $file = $this->file('pdf');

                if ($file === null || ! $file->isValid()) {
                    return;
                }

                $signature = file_get_contents($file->getRealPath(), false, null, 0, 5);

                if ($signature !== '%PDF-') {
                    $validator->errors()->add('pdf', 'The uploaded file does not contain a valid PDF signature.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'pdf.required' => 'Choose a PDF file to upload.',
            'pdf.extensions' => 'The digital edition must use the .pdf extension.',
            'pdf.mimes' => 'The digital edition must be a valid PDF.',
            'pdf.mimetypes' => 'The digital edition must report a PDF media type.',
            'pdf.max' => 'The PDF must be 90 MB or smaller.',
            'rights_basis.required' => 'Select the documented rights basis before publishing.',
            'rights_confirmed.required' => 'Confirm the distribution rights before publishing.',
            'rights_confirmed.accepted' => 'Confirm the distribution rights before publishing.',
        ];
    }
}
