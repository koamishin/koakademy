<?php

declare(strict_types=1);

namespace App\Filament\Resources\Faculties\Pages;

use App\Filament\Resources\Faculties\FacultyResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateFaculty extends CreateRecord
{
    #[Override]
    protected static string $resource = FacultyResource::class;
}
