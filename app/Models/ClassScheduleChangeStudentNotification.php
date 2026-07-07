<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ClassScheduleChangeStudentNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_schedule_change_id',
        'student_id',
        'user_id',
        'email',
        'notified_at',
        'notified_by_user_id',
    ];

    public function scheduleChange(): BelongsTo
    {
        return $this->belongsTo(ClassScheduleChange::class, 'class_schedule_change_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'notified_by_user_id');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereNull('notified_at');
    }

    protected function casts(): array
    {
        return [
            'notified_at' => 'datetime',
        ];
    }
}
