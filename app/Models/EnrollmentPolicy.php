<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\EnrollmentPolicyFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class EnrollmentPolicy extends Model
{
    /** @use HasFactory<EnrollmentPolicyFactory> */
    use HasFactory;

    protected $fillable = [
        'name', 'scope_key', 'school_id', 'student_type', 'course_id', 'school_year',
        'semester', 'is_enabled', 'created_by', 'active_version_id',
    ];

    /** @param array<string, mixed> $scope */
    public static function scopeKey(array $scope): string
    {
        return hash('sha256', implode('|', [
            'school:'.($scope['school_id'] ?? '*'),
            'student_type:'.($scope['student_type'] ?? '*'),
            'course:'.($scope['course_id'] ?? '*'),
            'school_year:'.($scope['school_year'] ?? '*'),
            'semester:'.($scope['semester'] ?? '*'),
        ]));
    }

    /** @return BelongsTo<School, $this> */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /** @return BelongsTo<Course, $this> */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<EnrollmentPolicyVersion, $this> */
    public function versions(): HasMany
    {
        return $this->hasMany(EnrollmentPolicyVersion::class);
    }

    /** @return BelongsTo<EnrollmentPolicyVersion, $this> */
    public function activeVersion(): BelongsTo
    {
        return $this->belongsTo(EnrollmentPolicyVersion::class, 'active_version_id');
    }

    /** @param Builder<self> $query */
    public function scopeEnabled(Builder $query): void
    {
        $query->where('is_enabled', true)->whereNotNull('active_version_id');
    }

    /** @return array<string, string> */
    public function scopeLabels(): array
    {
        return array_filter([
            'school' => $this->school?->name,
            'student_type' => $this->student_type,
            'program' => $this->course?->title ?? $this->course?->code,
            'school_year' => $this->school_year,
            'semester' => $this->semester === null ? null : (string) $this->semester,
        ], fn (?string $value): bool => $value !== null && $value !== '');
    }

    protected function casts(): array
    {
        return ['semester' => 'integer', 'is_enabled' => 'boolean'];
    }
}
