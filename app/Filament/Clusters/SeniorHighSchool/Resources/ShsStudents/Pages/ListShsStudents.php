<?php

declare(strict_types=1);

namespace App\Filament\Clusters\SeniorHighSchool\Resources\ShsStudents\Pages;

use App\Filament\Clusters\SeniorHighSchool\Resources\ShsStudents\ShsStudentResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
use Override;

final class ListShsStudents extends ListRecords
{
    #[Override]
    protected static string $resource = ShsStudentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
