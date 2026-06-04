<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Support\Facades\Schema;
use Laravel\Passkeys\Passkey as BasePasskey;

final class Passkey extends BasePasskey
{
    protected static function booted(): void
    {
        self::saving(function (Passkey $passkey): void {
            if (Schema::hasColumn($passkey->getTable(), 'authenticatable_id') && blank($passkey->getAttribute('authenticatable_id'))) {
                $passkey->setAttribute('authenticatable_id', $passkey->getAttribute('user_id'));
            }

            if (
                Schema::hasColumn($passkey->getTable(), 'data')
                && (blank($passkey->getAttribute('data')) || $passkey->isDirty('credential'))
            ) {
                $credential = $passkey->getAttribute('credential');

                $passkey->setAttribute(
                    'data',
                    is_string($credential) ? $credential : json_encode($credential ?? [], JSON_THROW_ON_ERROR),
                );
            }
        });
    }
}
