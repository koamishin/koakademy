<?php

declare(strict_types=1);

namespace App\Filament\Resources\Classes\Pages;

use App\Filament\Resources\Classes\ClassesResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateClasses extends CreateRecord
{
    #[Override]
    protected static string $resource = ClassesResource::class;
}
