<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Settings\SiteSettings;
use Illuminate\Http\JsonResponse;

final class AppManifestController extends Controller
{
    public function __invoke(SiteSettings $siteSettings): JsonResponse
    {
        $manifest = [
            'id' => '/',
            'name' => $siteSettings->getAppName(),
            'short_name' => $siteSettings->getAppShortName(),
            'description' => $siteSettings->description ?: $siteSettings->getTagline(),
            'start_url' => '/',
            'scope' => '/',
            'display' => 'standalone',
            'display_override' => ['standalone', 'minimal-ui', 'browser'],
            'background_color' => $siteSettings->getThemeColor(),
            'theme_color' => $siteSettings->getThemeColor(),
            'icons' => [
                [
                    'src' => '/web-app-manifest-192x192.png',
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any maskable',
                ],
                [
                    'src' => '/web-app-manifest-512x512.png',
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any maskable',
                ],
            ],
        ];

        return response()
            ->json($manifest)
            ->header('Content-Type', 'application/manifest+json');
    }
}
