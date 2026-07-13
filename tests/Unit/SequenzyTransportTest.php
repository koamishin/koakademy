<?php

declare(strict_types=1);

use App\Mail\Transports\SequenzyTransport;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mime\Email;

/**
 * @param  array<int, Response|Throwable>  $responses
 * @param  array<int, array<string, mixed>>  $history
 */
function buildSequenzyTransport(
    array $responses,
    array &$history,
    ?Closure $apiKeyResolver = null,
    int $maxAttachmentBytes = 40 * 1024 * 1024,
): SequenzyTransport {
    $handler = HandlerStack::create(new MockHandler($responses));
    $handler->push(Middleware::history($history));

    return new SequenzyTransport(
        client: new Client(['handler' => $handler]),
        apiKeyResolver: $apiKeyResolver ?? fn (): string => 'test-api-key',
        endpoint: 'https://api.sequenzy.test/api/v1/transactional/send',
        maxAttachmentBytes: $maxAttachmentBytes,
    );
}

it('sends Laravel email fields and attachments through the Sequenzy REST API', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([
        new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'success' => true,
            'jobId' => 'job_assessment_123',
        ], JSON_THROW_ON_ERROR)),
    ], $history);

    $pdfContent = "%PDF-test-content\xFF\x00";
    $email = (new Email)
        ->from('DCCP Portal <noreply@dccp.edu.ph>')
        ->to('student@dccp.edu.ph')
        ->cc('registrar@dccp.edu.ph')
        ->bcc('audit@dccp.edu.ph')
        ->replyTo('support@dccp.edu.ph')
        ->subject('Assessment form')
        ->html('<p>Your assessment form is attached.</p>')
        ->attach($pdfContent, 'assessment.pdf', 'application/pdf');

    $sentMessage = $transport->send($email);

    expect($sentMessage)->not->toBeNull()
        ->and($sentMessage?->getMessageId())->toBe('job_assessment_123')
        ->and($history)->toHaveCount(1);

    $request = $history[0]['request'];
    $payload = json_decode((string) $request->getBody(), true, 512, JSON_THROW_ON_ERROR);

    expect($request->getHeaderLine('Authorization'))->toBe('Bearer test-api-key')
        ->and($payload['to'])->toBe('student@dccp.edu.ph')
        ->and($payload['cc'])->toBe(['registrar@dccp.edu.ph'])
        ->and($payload['bcc'])->toBe(['audit@dccp.edu.ph'])
        ->and($payload['from'])->toBe('"DCCP Portal" <noreply@dccp.edu.ph>')
        ->and($payload['replyTo'])->toBe('support@dccp.edu.ph')
        ->and($payload['subject'])->toBe('Assessment form')
        ->and($payload['body'])->toContain('assessment form is attached')
        ->and($payload['attachments'])->toBe([[
            'filename' => 'assessment.pdf',
            'content' => base64_encode($pdfContent),
        ]]);
});

it('converts a text-only email to an HTML body', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([
        new Response(200, ['Content-Type' => 'application/json'], '{"success":true}'),
    ], $history);

    $transport->send(
        (new Email)
            ->from('noreply@dccp.edu.ph')
            ->to('student@dccp.edu.ph')
            ->subject('Plain message')
            ->text("First line\nSecond line"),
    );

    $payload = json_decode((string) $history[0]['request']->getBody(), true, 512, JSON_THROW_ON_ERROR);

    expect($payload['body'])->toContain('First line<br />', 'Second line');
});

it('fails before making a request when the API key is missing', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([], $history, fn (): null => null);

    $send = fn () => $transport->send(
        (new Email)->from('noreply@dccp.edu.ph')->to('student@dccp.edu.ph')->subject('Test')->html('<p>Test</p>'),
    );

    expect($send)->toThrow(TransportException::class, 'API key is not configured')
        ->and($history)->toBeEmpty();
});

it('rejects inline attachments because Sequenzy only supports regular files', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([], $history);
    $email = (new Email)
        ->from('noreply@dccp.edu.ph')
        ->to('student@dccp.edu.ph')
        ->subject('Inline image')
        ->html('<p>Image</p>')
        ->embed('image-bytes', 'logo.png', 'image/png');

    expect(fn () => $transport->send($email))
        ->toThrow(TransportException::class, 'does not support inline email attachments');
});

it('rejects attachments over the configured total size limit', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([], $history, maxAttachmentBytes: 4);
    $email = (new Email)
        ->from('noreply@dccp.edu.ph')
        ->to('student@dccp.edu.ph')
        ->subject('Large attachment')
        ->html('<p>Attachment</p>')
        ->attach('12345', 'large.pdf', 'application/pdf');

    expect(fn () => $transport->send($email))
        ->toThrow(TransportException::class, '40 MB total size limit');
});

it('turns Sequenzy API failures into transport exceptions for queue retries', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([
        new Response(401, ['Content-Type' => 'application/json'], json_encode([
            'success' => false,
            'error' => 'Unauthorized',
        ], JSON_THROW_ON_ERROR)),
    ], $history);

    $send = fn () => $transport->send(
        (new Email)->from('noreply@dccp.edu.ph')->to('student@dccp.edu.ph')->subject('Test')->html('<p>Test</p>'),
    );

    expect($send)->toThrow(TransportException::class, 'Sequenzy send failed (HTTP 401): Unauthorized');
});

it('turns connection failures into transport exceptions for queue retries', function (): void {
    $history = [];
    $transport = buildSequenzyTransport([
        new ConnectException('Connection timed out', new Request('POST', 'https://api.sequenzy.test')),
    ], $history);

    $send = fn () => $transport->send(
        (new Email)->from('noreply@dccp.edu.ph')->to('student@dccp.edu.ph')->subject('Test')->html('<p>Test</p>'),
    );

    expect($send)->toThrow(TransportException::class, 'Unable to connect to the Sequenzy API');
});
