<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class ClassChangeNotification extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<int, array{subject_code: string, subject_title: string, old_section: string, new_section: string}>  $classChanges
     * @param  array<string, mixed>  $siteSettings
     * @param  array{contents: string, name: string}|null  $attachmentData
     */
    public function __construct(
        public string $studentName,
        public string $studentEmail,
        public string $schoolYear,
        public string $semester,
        public array $classChanges,
        public string $changeReason,
        public array $siteSettings,
        public ?string $logoUrl,
        public ?string $assessmentPath,
        public ?array $attachmentData,
    ) {}

    public function envelope(): Envelope
    {
        $organizationName = $this->siteSettings['organizationName'] ?? config('app.name');

        return new Envelope(
            subject: sprintf(
                'Class Schedule Update - %s',
                $organizationName
            ),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.enrollment.class_change_notification',
            with: [
                'studentName' => $this->studentName,
                'studentEmail' => $this->studentEmail,
                'schoolYear' => $this->schoolYear,
                'semester' => $this->semester,
                'classChanges' => $this->classChanges,
                'changeReason' => $this->changeReason,
                'siteSettings' => $this->siteSettings,
                'logoUrl' => $this->logoUrl,
                'organizationName' => $this->siteSettings['organizationName'] ?? config('app.name'),
                'pdfAttached' => $this->attachmentData !== null,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if ($this->attachmentData === null) {
            return [];
        }

        return [
            Attachment::fromData(
                fn () => $this->attachmentData['contents'],
                $this->attachmentData['name'],
            )->withMime('application/pdf'),
        ];
    }
}
