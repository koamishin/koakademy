<?php

declare(strict_types=1);

namespace App\Filament\Resources\Rooms\Pages;

use App\Filament\Resources\Rooms\RoomResource;
use Filament\Resources\Pages\CreateRecord;
use Override;

final class CreateRoom extends CreateRecord
{
    #[Override]
    protected static string $resource = RoomResource::class;
}
