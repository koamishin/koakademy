<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\EnrollmentPolicyVersionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;
use Override;

final class EnrollmentPolicyVersion extends Model
{
    /** @use HasFactory<EnrollmentPolicyVersionFactory> */
    use HasFactory;

    public const string Draft = 'draft';

    public const string Published = 'published';

    public const string Archived = 'archived';

    #[Override]
    protected $fillable = [
        'enrollment_policy_id', 'version', 'state', 'schema_version', 'configuration',
        'checksum', 'change_notes', 'created_by', 'published_by', 'published_at',
    ];

    /** @return BelongsTo<EnrollmentPolicy, $this> */
    public function policy(): BelongsTo
    {
        return $this->belongsTo(EnrollmentPolicy::class, 'enrollment_policy_id');
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @param Builder<self> $query */
    public function scopeDraft(Builder $query): void
    {
        $query->where('state', self::Draft);
    }

    /** @param Builder<self> $query */
    public function scopePublished(Builder $query): void
    {
        $query->where('state', self::Published);
    }

    protected static function booted(): void
    {
        self::updating(function (self $version): void {
            if ($version->getOriginal('state') === self::Published) {
                throw new LogicException('Published enrollment policy versions are immutable.');
            }
        });

        self::deleting(function (self $version): void {
            if ($version->state === self::Published) {
                throw new LogicException('Published enrollment policy versions cannot be deleted.');
            }
        });
    }

    protected function casts(): array
    {
        return [
            'configuration' => 'array',
            'schema_version' => 'integer',
            'version' => 'integer',
            'published_at' => 'immutable_datetime',
        ];
    }
}
