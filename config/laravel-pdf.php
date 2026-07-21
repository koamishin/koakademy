<?php

declare(strict_types=1);

use Spatie\LaravelPdf\Jobs\GeneratePdfJob;

return [
    /*
     * The default driver to use for PDF generation.
     * KoAkademy's supported self-hosted driver is Gotenberg.
     */
    'driver' => env('LARAVEL_PDF_DRIVER', 'gotenberg'),

    /*
     * Driver strategy profiles by environment.
     */
    'strategy' => [
        'profiles' => [
            'production' => [
                'primary' => env('LARAVEL_PDF_PRODUCTION_DRIVER', 'gotenberg'),
                'fallback' => array_values(array_filter(array_map(
                    static fn (string $driver): string => mb_trim($driver),
                    explode(',', env('LARAVEL_PDF_PRODUCTION_FALLBACK', '')),
                ))),
            ],
            'staging' => [
                'primary' => env('LARAVEL_PDF_STAGING_DRIVER', 'gotenberg'),
                'fallback' => array_values(array_filter(array_map(
                    static fn (string $driver): string => mb_trim($driver),
                    explode(',', env('LARAVEL_PDF_STAGING_FALLBACK', '')),
                ))),
            ],
            'local' => [
                'primary' => env('LARAVEL_PDF_LOCAL_DRIVER', 'gotenberg'),
                'fallback' => array_values(array_filter(array_map(
                    static fn (string $driver): string => mb_trim($driver),
                    explode(',', env('LARAVEL_PDF_LOCAL_FALLBACK', '')),
                ))),
            ],
        ],
        'rollback_driver' => env('LARAVEL_PDF_ROLLBACK_DRIVER', 'gotenberg'),
    ],

    /*
     * The job class used for queued PDF generation.
     * You can replace this with your own class that extends GeneratePdfJob
     * to customize things like $tries, $timeout, $backoff, or default queue.
     */
    'job' => GeneratePdfJob::class,

    /*
     * Cloudflare Browser Rendering driver configuration.
     *
     * Requires a Cloudflare account with the Browser Rendering API enabled.
     * https://developers.cloudflare.com/browser-rendering/
     */
    'cloudflare' => [
        'api_token' => env('CLOUDFLARE_API_TOKEN'),
        'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
    ],

    /*
     * Gotenberg driver configuration.
     *
     * Requires a running Gotenberg instance (Docker recommended).
     * https://gotenberg.dev
     */
    'gotenberg' => [
        'url' => env('GOTENBERG_URL', 'http://localhost:3000'),
        'username' => env('GOTENBERG_USERNAME'),
        'password' => env('GOTENBERG_PASSWORD'),
    ],

    /*
    * WeasyPrint driver configuration.
    *
    * Requires the Weasyprint binary and pontedilana/php-weasyprint package:
    * composer require pontedilana/php-weasyprint
    *
    * @see https://doc.courtbouillon.org/weasyprint/stable/first_steps.html
    */
    'weasyprint' => [
        /*
         * Configure the paths to the Weasyprint binary.
         */
        'binary' => env('LARAVEL_PDF_WEASYPRINT_BINARY', 'weasyprint'),

        /*
         * The timeout (default = 10 seconds)
         */
        'timeout' => 10,
    ],
];
