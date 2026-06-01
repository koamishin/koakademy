<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Settings\SiteSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ApplicantApprovedForRequirements extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $senderName,
        private readonly string $senderRole
    ) {
        $this->afterCommit();
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $siteSettings = app(SiteSettings::class)->getBrandingArray();

        $logoUrl = $siteSettings['logo'] ?? null;
        if ($logoUrl && ! str_starts_with((string) $logoUrl, 'http')) {
            $logoUrl = url($logoUrl);
        }

        return (new MailMessage)
            ->subject(sprintf(
                'Online Application Approved - Visit the Registrar | %s',
                $siteSettings['organizationName'] ?? config('app.name')
            ))
            ->markdown('emails.enrollment.applicant-approved', [
                'studentName' => $notifiable->full_name ?? $notifiable->first_name ?? 'Applicant',
                'program' => $notifiable->Course?->code,
                'department' => $notifiable->Course?->department?->code,
                'siteSettings' => $siteSettings,
                'logoUrl' => $logoUrl,
                'senderName' => $this->senderName,
                'senderRole' => $this->senderRole,
            ]);
    }
}
