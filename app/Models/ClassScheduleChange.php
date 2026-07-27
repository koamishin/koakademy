<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

final class ClassScheduleChange extends Model
{
    use HasFactory;

    #[Override]
    protected $fillable = [
        'class_id',
        'changed_by_user_id',
        'old_schedule',
        'new_schedule',
    ];

    public function class(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }

    public function studentNotifications(): HasMany
    {
        return $this->hasMany(ClassScheduleChangeStudentNotification::class);
    }

    protected function casts(): array
    {
        return [
            'old_schedule' => 'array',
            'new_schedule' => 'array',
        ];
    }
}
