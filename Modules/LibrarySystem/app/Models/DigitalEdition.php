<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\LibrarySystem\Enums\DigitalEditionStatus;
use Modules\LibrarySystem\Enums\DigitalRightsBasis;

final class DigitalEdition extends Model
{
    protected $table = 'library_book_digital_editions';

    protected $fillable = [
        'book_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'sha256',
        'status',
        'downloads_allowed',
        'rights_basis',
        'rights_holder',
        'license_url',
        'rights_notes',
        'rights_expires_at',
        'uploaded_by',
        'uploaded_at',
        'published_by',
        'published_at',
        'rights_confirmed_by',
        'rights_confirmed_at',
    ];

    protected $attributes = [
        'mime_type' => 'application/pdf',
        'status' => 'draft',
        'downloads_allowed' => false,
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function rightsConfirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rights_confirmed_by');
    }

    public function scopeAccessible(Builder $query): Builder
    {
        return $query
            ->where('status', DigitalEditionStatus::Published->value)
            ->whereNotNull('rights_basis')
            ->whereNotNull('rights_confirmed_at')
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('rights_expires_at')
                    ->orWhere('rights_expires_at', '>', now());
            });
    }

    public function isAccessible(): bool
    {
        return $this->status === DigitalEditionStatus::Published
            && $this->rights_basis instanceof DigitalRightsBasis
            && $this->rights_confirmed_at !== null
            && ($this->rights_expires_at === null || $this->rights_expires_at->isFuture());
    }

    protected function casts(): array
    {
        return [
            'status' => DigitalEditionStatus::class,
            'rights_basis' => DigitalRightsBasis::class,
            'downloads_allowed' => 'boolean',
            'size_bytes' => 'integer',
            'rights_expires_at' => 'datetime',
            'uploaded_at' => 'datetime',
            'published_at' => 'datetime',
            'rights_confirmed_at' => 'datetime',
        ];
    }
}
