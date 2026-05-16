<?php

declare(strict_types=1);

namespace App\Filament\Auth\MultiFactor;

use App\Models\User;
use App\Notifications\FilamentEmailAuthenticationCode;
use Filament\Auth\MultiFactor\Email\EmailAuthentication;
use Illuminate\Contracts\Auth\Authenticatable;

final class SecurityAwareEmailAuthentication extends EmailAuthentication
{
    protected string $codeNotification = FilamentEmailAuthenticationCode::class;

    public function isEnabled(Authenticatable $user): bool
    {
        if ($user instanceof User && ! ($user->security_two_factor_enabled ?? true)) {
            return false;
        }

        return parent::isEnabled($user);
    }
}
