<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

final class FacultyDeadline extends Model
{
    use HasFactory;

    #[Override]
    protected $table = 'faculty_deadlines';

    #[Override]
    protected $fillable = [
        'title',
        'description',
        'due_date',
        'priority',
        'type',
        'faculty_id',
        'class_id',
        'is_active',
    ];

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'id');
    }

    public function relatedClass(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id', 'id');
    }

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
            'faculty_id' => 'string',
            'class_id' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
