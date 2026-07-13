<?php

declare(strict_types=1);

namespace App\Providers;

use App\Mail\SequenzyApiKeyResolver;
use App\Mail\Transports\SequenzyTransport;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Psr\Log\LoggerInterface;

final class SequenzyMailServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Mail::extend('sequenzy', function (array $config): SequenzyTransport {
            return new SequenzyTransport(
                client: new Client,
                apiKeyResolver: fn (): ?string => app(SequenzyApiKeyResolver::class)->resolve(),
                endpoint: (string) ($config['endpoint'] ?? 'https://api.sequenzy.com/api/v1/transactional/send'),
                timeout: (float) ($config['timeout'] ?? 15),
                sequenzyLogger: app(LoggerInterface::class),
            );
        });
    }
}
