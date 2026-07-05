<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Override;

final class IdSequence extends Model
{
    #[Override]
    protected $fillable = [
        'key',
        'label',
        'start_number',
        'next_number',
        'increment_by',
        'padding',
    ];

    protected function casts(): array
    {
        return [
            'start_number' => 'integer',
            'next_number' => 'integer',
            'increment_by' => 'integer',
            'padding' => 'integer',
        ];
    }
}
