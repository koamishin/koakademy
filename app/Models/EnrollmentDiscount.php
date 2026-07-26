<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

/**
 * @property int $id
 * @property string $name
 * @property string $normalized_name
 * @property int $percentage
 *
 * @method static Builder<static>|EnrollmentDiscount newModelQuery()
 * @method static Builder<static>|EnrollmentDiscount newQuery()
 * @method static Builder<static>|EnrollmentDiscount query()
 *
 * @mixin \Eloquent
 */
final class EnrollmentDiscount extends Model
{
    #[Override]
    protected $fillable = [
        'name',
        'normalized_name',
        'percentage',
    ];

    public function studentTuitions(): HasMany
    {
        return $this->hasMany(StudentTuition::class, 'discount_id');
    }

    protected function casts(): array
    {
        return [
            'percentage' => 'integer',
        ];
    }
}
