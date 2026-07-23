<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LibraryBookmark extends Model
{
    protected $table = 'library_bookmarks';

    protected $fillable = [
        'user_id',
        'book_id',
        'page',
        'label',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    protected function casts(): array
    {
        return [
            'page' => 'integer',
        ];
    }
}
