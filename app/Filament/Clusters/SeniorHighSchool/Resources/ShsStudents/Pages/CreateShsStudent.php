<?php

declare(strict_types=1);

namespace App\Filament\Clusters\SeniorHighSchool\Resources\ShsStudents\Pages;

use App\Filament\Clusters\SeniorHighSchool\Resources\ShsStudents\ShsStudentResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateShsStudent extends CreateRecord
{
    #[Override]
    protected static string $resource = ShsStudentResource::class;
}
