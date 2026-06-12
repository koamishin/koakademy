<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;

trait ConfiguresPasskeysForRequest
{
    private function configurePasskeysForRequest(Request $request): void
    {
        $appOrigin = $this->configuredAppOrigin();
        $appHost = $this->configuredAppHost();

        config([
            'passkeys.relying_party_id' => $appHost ?? $request->getHost(),
            'passkeys.allowed_origins' => array_values(array_unique(array_filter([
                $request->getSchemeAndHttpHost(),
                $appOrigin,
            ]))),
        ]);
    }

    private function configuredAppOrigin(): ?string
    {
        $appUrl = config('app.url');

        if (! is_string($appUrl) || $appUrl === '') {
            return null;
        }

        $scheme = parse_url($appUrl, PHP_URL_SCHEME);
        $host = parse_url($appUrl, PHP_URL_HOST);
        $port = parse_url($appUrl, PHP_URL_PORT);

        if (! is_string($scheme) || ! is_string($host)) {
            return null;
        }

        return $scheme.'://'.$host.($port ? ':'.$port : '');
    }

    private function configuredAppHost(): ?string
    {
        $appUrl = config('app.url');

        if (! is_string($appUrl) || $appUrl === '') {
            return null;
        }

        $host = parse_url($appUrl, PHP_URL_HOST);

        return is_string($host) ? $host : null;
    }
}
