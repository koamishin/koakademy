<?php

declare(strict_types=1);

use App\Filament\Auth\MultiFactor\SecurityAwareEmailAuthentication;
use App\Notifications\FilamentEmailAuthenticationCode;

it('uses the custom minimal email notification for Filament email authentication codes', function (): void {
    expect(SecurityAwareEmailAuthentication::make()->getCodeNotification())
        ->toBe(FilamentEmailAuthenticationCode::class);
});

it('renders the minimal upgraded email authentication code template', function (): void {
    $mail = (new FilamentEmailAuthenticationCode(
        code: '797254',
        codeExpiryMinutes: 30,
    ))->toMail(new stdClass);

    $html = (string) $mail->render();

    expect($mail->subject)
        ->toBe(config('app.name').' — Sign-in code')
        ->and($html)->toContain('Hello!')
        ->and($html)->toContain('797254')
        ->and($html)->toContain('This code expires in 30 minutes.')
        ->and($html)->toContain('If you did not attempt to sign in');
});
