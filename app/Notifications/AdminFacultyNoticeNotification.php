<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class AdminFacultyNoticeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly string $priority = 'normal',
        private readonly ?string $actionUrl = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->priority,
            'priority' => $this->priority,
            'icon' => 'heroicon-o-megaphone',
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionUrl ? 'Open' : null,
        ];
    }
}
