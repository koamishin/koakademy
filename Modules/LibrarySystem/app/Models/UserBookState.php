<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class UserBookState extends Model
{
    protected $table = 'library_user_book_states';

    protected $fillable = [
        'user_id',
        'book_id',
        'last_page',
        'total_pages',
        'favorited_at',
        'last_read_at',
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
            'last_page' => 'integer',
            'total_pages' => 'integer',
            'favorited_at' => 'datetime',
            'last_read_at' => 'datetime',
        ];
    }
}
