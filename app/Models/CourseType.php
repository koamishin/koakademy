<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Override;

final class CourseType extends Model
{
    use HasFactory;

    #[Override]
    protected $fillable = ['name'];

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
