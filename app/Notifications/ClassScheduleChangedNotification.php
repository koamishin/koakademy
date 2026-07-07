<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class ClassScheduleChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, string>  $oldSchedule
     * @param  array<int, string>  $newSchedule
     */
    public function __construct(
        private readonly int $classId,
        private readonly string $classTitle,
        private readonly array $oldSchedule,
        private readonly array $newSchedule,
        private readonly ?int $changedByUserId = null,
        private readonly ?string $changedByName = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        if ($notifiable instanceof User) {
            return ['database'];
        }

        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(sprintf('Class schedule updated: %s', $this->classTitle))
            ->greeting('Hello,')
            ->line(sprintf('The schedule for %s has been updated.', $this->classTitle))
            ->line('Previous schedule:')
            ->lines($this->oldSchedule === [] ? ['No previous schedule.'] : $this->oldSchedule)
            ->line('New schedule:')
            ->lines($this->newSchedule === [] ? ['No scheduled meetings.'] : $this->newSchedule)
            ->action('View class', $this->actionUrl())
            ->line('Please check your student portal for the latest class details.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Class schedule updated',
            'message' => sprintf('The schedule for %s has changed.', $this->classTitle),
            'type' => 'class_schedule_changed',
            'priority' => 'high',
            'icon' => 'heroicon-o-calendar-days',
            'class_id' => $this->classId,
            'class_title' => $this->classTitle,
            'old_schedule' => $this->oldSchedule,
            'new_schedule' => $this->newSchedule,
            'changed_by_user_id' => $this->changedByUserId,
            'changed_by_name' => $this->changedByName,
            'action_url' => $this->actionUrl(),
            'action_text' => 'View class',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->toArray($notifiable);
    }

    private function actionUrl(): string
    {
        return url('/student/classes/'.$this->classId);
    }
}
