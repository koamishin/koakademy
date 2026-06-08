<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Spatie\LaravelPdf\Enums\Format;
use Spatie\LaravelPdf\Facades\Pdf;

final class TestMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public string $testType = 'html',
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $settings = app(\App\Settings\SiteSettings::class);
        $appName = $settings->getAppName();

        $subject = match ($this->testType) {
            'plain' => "{$appName} - Plain Text Test Email",
            'markdown' => "{$appName} - Markdown Test Email",
            'pdf-attachment' => "{$appName} - PDF Attachment Test Email",
            default => "{$appName} - HTML Test Email",
        };

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $settings = app(\App\Settings\SiteSettings::class);
        $appName = $settings->getAppName();
        $orgName = $settings->getOrganizationName();

        if ($this->testType === 'markdown') {
            return new Content(
                markdown: 'emails.test-md',
                with: [
                    'appName' => $appName,
                    'orgName' => $orgName,
                ],
            );
        }

        return new Content(
            view: 'emails.test',
            with: [
                'appName' => $appName,
                'orgName' => $orgName,
                'testType' => $this->testType,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if ($this->testType !== 'pdf-attachment') {
            return [];
        }

        $settings = app(\App\Settings\SiteSettings::class);

        $pdfBase64 = Pdf::view('pdf.test', [
            'appName' => $settings->getAppName(),
            'orgName' => $settings->getOrganizationName(),
        ])
            ->format(Format::A4)
            ->base64();

        return [
            Attachment::fromData(fn () => base64_decode($pdfBase64), 'koakademy-test-document.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
