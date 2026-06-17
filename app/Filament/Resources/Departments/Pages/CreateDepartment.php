<?php

declare(strict_types=1);

namespace App\Filament\Resources\Departments\Pages;

use App\Filament\Resources\Departments\DepartmentResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateDepartment extends CreateRecord
{
    #[Override]
    protected static string $resource = DepartmentResource::class;
}
