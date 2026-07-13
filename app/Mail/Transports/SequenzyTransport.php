<?php

declare(strict_types=1);

namespace App\Mail\Transports;

use Closure;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use JsonException;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

final class SequenzyTransport extends AbstractTransport
{
    private const int DEFAULT_MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

    /**
     * @param  Closure(): ?string  $apiKeyResolver
     */
    public function __construct(
        private readonly ClientInterface $client,
        private readonly Closure $apiKeyResolver,
        private readonly string $endpoint,
        private readonly float $timeout = 15.0,
        private readonly int $maxAttachmentBytes = self::DEFAULT_MAX_ATTACHMENT_BYTES,
        private readonly ?LoggerInterface $sequenzyLogger = null,
    ) {
        parent::__construct(logger: $sequenzyLogger);
    }

    public function __toString(): string
    {
        return 'sequenzy';
    }

    protected function doSend(SentMessage $message): void
    {
        $email = $message->getOriginalMessage();

        if (! $email instanceof Email) {
            throw new TransportException('Sequenzy only supports Symfony Email messages.');
        }

        $apiKey = ($this->apiKeyResolver)();

        if (! filled($apiKey)) {
            throw new TransportException('The Sequenzy API key is not configured.');
        }

        $payload = $this->buildPayload($email);

        try {
            $response = $this->client->request('POST', $this->endpoint, [
                'headers' => [
                    'Authorization' => 'Bearer '.$apiKey,
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
                'timeout' => $this->timeout,
                'connect_timeout' => $this->timeout,
                'http_errors' => false,
            ]);
        } catch (GuzzleException $exception) {
            throw new TransportException(
                'Unable to connect to the Sequenzy API: '.$exception->getMessage(),
                previous: $exception,
            );
        }

        $statusCode = $response->getStatusCode();

        try {
            $responseData = json_decode(
                (string) $response->getBody(),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (JsonException $exception) {
            throw new TransportException(
                "Sequenzy returned an invalid JSON response (HTTP {$statusCode}).",
                previous: $exception,
            );
        }

        if (! is_array($responseData)) {
            throw new TransportException("Sequenzy returned an invalid response payload (HTTP {$statusCode}).");
        }

        if ($statusCode < 200 || $statusCode >= 300 || ($responseData['success'] ?? false) !== true) {
            $error = is_string($responseData['error'] ?? null)
                ? $responseData['error']
                : 'The request was rejected.';

            throw new TransportException("Sequenzy send failed (HTTP {$statusCode}): {$error}");
        }

        $jobId = $responseData['jobId'] ?? null;

        if (is_string($jobId) && $jobId !== '') {
            $message->setMessageId($jobId);
        }

        $this->sequenzyLogger?->info('Sequenzy accepted an email for delivery.', [
            'job_id' => is_string($jobId) ? $jobId : null,
            'recipient_count' => count($email->getTo()) + count($email->getCc()) + count($email->getBcc()),
            'attachment_count' => count($email->getAttachments()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(Email $email): array
    {
        $to = $this->addresses($email->getTo());

        if ($to === []) {
            throw new TransportException('Sequenzy requires at least one To recipient.');
        }

        $subject = mb_trim((string) $email->getSubject());

        if ($subject === '') {
            throw new TransportException('Sequenzy requires an email subject.');
        }

        $payload = [
            'to' => count($to) === 1 ? $to[0] : $to,
            'subject' => $subject,
            'body' => $this->htmlBody($email),
        ];

        $this->addRecipients($payload, 'cc', $email->getCc());
        $this->addRecipients($payload, 'bcc', $email->getBcc());

        if ($email->getFrom() !== []) {
            $payload['from'] = $this->formatAddress($email->getFrom()[0]);
        }

        if ($email->getReplyTo() !== []) {
            $payload['replyTo'] = $this->formatAddress($email->getReplyTo()[0]);
        }

        $attachments = [];
        $totalAttachmentBytes = 0;

        foreach ($email->getAttachments() as $attachment) {
            if ($attachment->getDisposition() === 'inline') {
                throw new TransportException('Sequenzy does not support inline email attachments.');
            }

            $content = $attachment->getBody();
            $totalAttachmentBytes += mb_strlen($content, '8bit');

            if ($totalAttachmentBytes > $this->maxAttachmentBytes) {
                throw new TransportException('Sequenzy attachments exceed the 40 MB total size limit.');
            }

            $filename = $attachment->getFilename();

            if (! is_string($filename) || $filename === '') {
                throw new TransportException('Every Sequenzy attachment must have a filename.');
            }

            $attachments[] = [
                'filename' => $filename,
                'content' => base64_encode($content),
            ];
        }

        if ($attachments !== []) {
            $payload['attachments'] = $attachments;
        }

        return $payload;
    }

    private function htmlBody(Email $email): string
    {
        $html = $email->getHtmlBody();

        if (is_resource($html)) {
            $html = stream_get_contents($html);
        }

        if (is_string($html) && $html !== '') {
            return $html;
        }

        $text = $email->getTextBody();

        if (is_resource($text)) {
            $text = stream_get_contents($text);
        }

        if (! is_string($text) || $text === '') {
            throw new TransportException('Sequenzy requires an HTML or text email body.');
        }

        return nl2br(htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  Address[]  $addresses
     */
    private function addRecipients(array &$payload, string $field, array $addresses): void
    {
        $values = $this->addresses($addresses);

        if ($values !== []) {
            $payload[$field] = $values;
        }
    }

    /**
     * @param  Address[]  $addresses
     * @return string[]
     */
    private function addresses(array $addresses): array
    {
        return array_map(
            static fn (Address $address): string => $address->getAddress(),
            $addresses,
        );
    }

    private function formatAddress(Address $address): string
    {
        return $address->toString();
    }
}
