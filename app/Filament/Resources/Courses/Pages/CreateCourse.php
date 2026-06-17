<?php

declare(strict_types=1);

namespace App\Filament\Resources\Courses\Pages;

use App\Filament\Resources\Courses\CourseResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateCourse extends CreateRecord
{
    #[Override]
    protected static string $resource = CourseResource::class;
}
