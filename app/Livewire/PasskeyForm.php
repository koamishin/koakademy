<?php

declare(strict_types=1);

namespace App\Livewire;

use Filament\Actions\Action;
use Filament\Actions\Concerns\InteractsWithActions;
use Filament\Actions\Contracts\HasActions;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View as ViewContract;
use Joaopaulolndev\FilamentEditProfile\Concerns\HasSort;
use Laravel\Passkeys\Actions\DeletePasskey;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Passkeys;
use Livewire\Component;
use RuntimeException;

final class PasskeyForm extends Component implements HasActions, HasForms
{
    use HasSort;
    use InteractsWithActions;
    use InteractsWithForms;

    public string $name = '';

    protected static int $sort = 0;

    public function deleteAction(): Action
    {
        return Action::make('delete')
            ->label(__('filament-passkeys::passkeys.delete'))
            ->color('danger')
            ->requiresConfirmation()
            ->action(fn (array $arguments) => $this->deletePasskey($arguments['passkey']));
    }

    public function deletePasskey(int|string $passkeyId): void
    {
        $user = $this->currentUser();

        /** @var Passkey $passkey */
        $passkey = Passkeys::passkeyModel()::query()->findOrFail($passkeyId);

        abort_unless((string) $passkey->user_id === (string) $user->getKey(), 403);

        app(DeletePasskey::class)($user, $passkey);

        Notification::make()
            ->title(__('filament-passkeys::passkeys.deleted_notification_title'))
            ->success()
            ->send();
    }

    public function passkeyCreated(): void
    {
        $this->reset('name');

        Notification::make()
            ->title(__('filament-passkeys::passkeys.created_notification_title'))
            ->success()
            ->send();
    }

    public function passkeyAlreadyExists(): void
    {
        Notification::make()
            ->title(__('filament-passkeys::passkeys.already_exists_notification_title'))
            ->danger()
            ->send();
    }

    public function render(): ViewContract
    {
        return view('livewire.passkey-form', [
            'passkeys' => $this->passkeys(),
        ]);
    }

    private function currentUser(): PasskeyUser
    {
        $user = Auth::user();

        if (! $user instanceof Authenticatable) {
            throw new RuntimeException('A user must be authenticated to manage passkeys.');
        }

        if (! $user instanceof PasskeyUser) {
            throw new RuntimeException('User model must implement the Laravel PasskeyUser contract.');
        }

        return $user;
    }

    private function passkeys(): Collection
    {
        return $this->currentUser()
            ->passkeys()
            ->latest()
            ->get();
    }
}
