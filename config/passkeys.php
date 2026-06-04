<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Relying Party ID
    |--------------------------------------------------------------------------
    |
    | The relying party ID represents your application in the WebAuthn protocol.
    | This is typically your domain. Passkeys are bound to this ID and can only
    | be verified on matching domains.
    |
    */

    'relying_party_id' => parse_url(config('app.url'), PHP_URL_HOST),

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins
    |--------------------------------------------------------------------------
    |
    | The origins permitted to complete WebAuthn ceremonies. Passkeys bound to
    | the relying party ID above will only verify when the browser reports one
    | of these origins. Custom app endpoints override this per request.
    |
    */

    'allowed_origins' => [
        config('app.url'),
    ],

    /*
    |--------------------------------------------------------------------------
    | User Handle Secret
    |--------------------------------------------------------------------------
    |
    | Secret used to derive a stable WebAuthn user handle from each user model.
    | Set this explicitly if you rotate your application key.
    |
    */

    'user_handle_secret' => env('PASSKEYS_USER_HANDLE_SECRET', config('app.key')),

    /*
    |--------------------------------------------------------------------------
    | WebAuthn Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout in milliseconds for WebAuthn operations.
    |
    */

    'timeout' => 60000,

    /*
    |--------------------------------------------------------------------------
    | Authentication Guard
    |--------------------------------------------------------------------------
    */

    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Passkeys Routes Middleware
    |--------------------------------------------------------------------------
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Passkeys Management Middleware
    |--------------------------------------------------------------------------
    */

    'management_middleware' => ['password.confirm'],

    /*
    |--------------------------------------------------------------------------
    | Passkeys Throttling
    |--------------------------------------------------------------------------
    */

    'throttle' => 'throttle:6,1',

    /*
    |--------------------------------------------------------------------------
    | Redirect
    |--------------------------------------------------------------------------
    */

    'redirect' => '/dashboard',
];
