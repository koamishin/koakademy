<?php

declare(strict_types=1);

namespace App\Filament\Resources\Schools\Pages;

use App\Filament\Resources\Schools\SchoolResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateSchool extends CreateRecord
{
    #[Override]
    protected static string $resource = SchoolResource::class;
}
