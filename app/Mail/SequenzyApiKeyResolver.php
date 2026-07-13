<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\GeneralSetting;
use Illuminate\Support\Facades\Log;
use Throwable;

final class SequenzyApiKeyResolver
{
    public function resolve(): ?string
    {
        try {
            $settings = GeneralSetting::query()->first(['sequenzy_api_key']);
            $databaseKey = $settings?->sequenzy_api_key;

            if (filled($databaseKey)) {
                return mb_trim((string) $databaseKey);
            }
        } catch (Throwable $exception) {
            Log::warning('Unable to resolve the Sequenzy API key from database settings.', [
                'exception' => $exception::class,
            ]);
        }

        $configuredKey = config('services.sequenzy.key')
            ?: config('services.sequenzy.legacy_key');

        return filled($configuredKey) ? mb_trim((string) $configuredKey) : null;
    }
}
