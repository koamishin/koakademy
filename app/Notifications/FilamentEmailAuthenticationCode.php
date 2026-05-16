<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class FilamentEmailAuthenticationCode extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $code,
        public int $codeExpiryMinutes,
    ) {}

    /**
     * @return array<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(config('app.name').' — Sign-in code')
            ->view('emails.filament-email-authentication-code', [
                'appName' => config('app.name'),
                'appUrl' => config('app.url'),
                'code' => $this->code,
                'codeExpiryMinutes' => $this->codeExpiryMinutes,
            ]);
    }
}
