<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Actions;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\LibrarySystem\Enums\DigitalEditionStatus;
use Modules\LibrarySystem\Models\Book;
use Modules\LibrarySystem\Models\DigitalEdition;
use RuntimeException;
use Throwable;

final class StoreDigitalEdition
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(Book $book, UploadedFile $file, array $attributes, User $actor): DigitalEdition
    {
        $attributes['status'] = DigitalEditionStatus::Draft->value;
        $attributes['downloads_allowed'] = false;

        $disk = (string) config('librarysystem.ebooks.disk', 'library');
        $path = sprintf(
            'books/%d/%s.pdf',
            $book->id,
            Str::uuid()->toString()
        );
        $sha256 = hash_file('sha256', $file->getRealPath());
        $stream = fopen($file->getRealPath(), 'rb');

        if ($stream === false) {
            throw new RuntimeException('The uploaded PDF could not be opened.');
        }

        try {
            Storage::disk($disk)->writeStream($path, $stream, [
                'visibility' => 'private',
                'ContentType' => 'application/pdf',
            ]);
        } finally {
            fclose($stream);
        }

        try {
            [$edition, $previousObject] = DB::transaction(function () use (
                $book,
                $file,
                $attributes,
                $actor,
                $disk,
                $path,
                $sha256
            ): array {
                Book::query()->whereKey($book->id)->lockForUpdate()->firstOrFail();

                $edition = DigitalEdition::query()
                    ->where('book_id', $book->id)
                    ->lockForUpdate()
                    ->first();

                $previousObject = $edition instanceof DigitalEdition
                    ? ['disk' => $edition->disk, 'path' => $edition->path]
                    : null;

                $edition ??= new DigitalEdition(['book_id' => $book->id]);
                $edition->fill($this->editionAttributes($attributes, $actor));
                $edition->fill([
                    'disk' => $disk,
                    'path' => $path,
                    'original_name' => Str::limit($file->getClientOriginalName(), 255, ''),
                    'mime_type' => 'application/pdf',
                    'size_bytes' => $file->getSize(),
                    'sha256' => $sha256,
                    'uploaded_by' => $actor->id,
                    'uploaded_at' => now(),
                ]);
                $edition->save();

                activity('library')
                    ->causedBy($actor)
                    ->performedOn($book)
                    ->withProperties([
                        'digital_edition_id' => $edition->id,
                        'status' => $edition->status->value,
                        'downloads_allowed' => $edition->downloads_allowed,
                        'replacement' => $previousObject !== null,
                    ])
                    ->log($previousObject === null ? 'Uploaded a digital edition' : 'Replaced a digital edition');

                return [$edition, $previousObject];
            });
        } catch (Throwable $throwable) {
            Storage::disk($disk)->delete($path);

            throw $throwable;
        }

        if (is_array($previousObject)) {
            try {
                Storage::disk($previousObject['disk'])->delete($previousObject['path']);
            } catch (Throwable $throwable) {
                report($throwable);
            }
        }

        return $edition->refresh();
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    public function editionAttributes(array $attributes, User $actor): array
    {
        $status = DigitalEditionStatus::from((string) $attributes['status']);
        $publishing = $status === DigitalEditionStatus::Published;

        return [
            'status' => $status,
            'downloads_allowed' => (bool) $attributes['downloads_allowed'],
            'rights_basis' => $attributes['rights_basis'] ?? null,
            'rights_holder' => $attributes['rights_holder'] ?? null,
            'license_url' => $attributes['license_url'] ?? null,
            'rights_notes' => $attributes['rights_notes'] ?? null,
            'rights_expires_at' => $attributes['rights_expires_at'] ?? null,
            'published_by' => $publishing ? $actor->id : null,
            'published_at' => $publishing ? now() : null,
            'rights_confirmed_by' => $publishing ? $actor->id : null,
            'rights_confirmed_at' => $publishing ? now() : null,
        ];
    }
}
