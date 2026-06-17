<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Override;

final class HelpTicket extends Model
{
    #[Override]
    protected $fillable = [
        'user_id',
        'type',
        'subject',
        'message',
        'status',
        'priority',
        'attachments',
    ];

    #[Override]
    protected $casts = [
        'attachments' => 'array',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replies(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(HelpTicketReply::class);
    }
}
