<?php

declare(strict_types=1);

namespace App\Filament\Resources\Classes\Pages;

use App\Filament\Resources\Classes\ClassesResource;
use App\Models\Classes;
use App\Models\User;
use App\Services\ClassScheduleChangeNotificationService;
use Filament\Actions\DeleteAction;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Auth;
use Override;

final class EditClasses extends EditRecord
{
    #[Override]
    protected static string $resource = ClassesResource::class;

    /**
     * @var array<int, array{day_of_week: string, start_time: string, end_time: string, room_id: int|null, room_name: string|null}>
     */
    private array $oldScheduleSnapshot = [];

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
            DeleteAction::make(),
        ];
    }

    protected function beforeSave(): void
    {
        if ($this->record instanceof Classes) {
            $this->oldScheduleSnapshot = app(ClassScheduleChangeNotificationService::class)
                ->snapshot($this->record);
        }
    }

    protected function afterSave(): void
    {
        if (! $this->record instanceof Classes) {
            return;
        }

        app(ClassScheduleChangeNotificationService::class)->notifyIfChanged(
            $this->record,
            $this->oldScheduleSnapshot,
            Auth::user() instanceof User ? Auth::user() : null
        );
    }
}
