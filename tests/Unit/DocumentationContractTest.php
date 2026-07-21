<?php

declare(strict_types=1);

it('marks every generated technical MDX mirror with its canonical source', function (): void {
    $mirrors = [
        'GETTING_STARTED.md' => 'docs/src/content/docs/getting-started/installation.mdx',
        'DEPLOYMENT.md' => 'docs/src/content/docs/getting-started/docker.mdx',
        'CONFIGURATION.md' => 'docs/src/content/docs/getting-started/configuration.mdx',
        'TROUBLESHOOTING.md' => 'docs/src/content/docs/getting-started/troubleshooting.mdx',
        'CONTRIBUTING.md' => 'docs/src/content/docs/getting-started/contributing.mdx',
        'DEVELOPMENT.md' => 'docs/src/content/docs/development.mdx',
        'ARCHITECTURE.md' => 'docs/src/content/docs/getting-started/architecture.mdx',
        'FAQ.md' => 'docs/src/content/docs/getting-started/faq.mdx',
    ];

    foreach ($mirrors as $source => $target) {
        $content = file_get_contents(base_path($target)) ?: '';

        expect($content)->toContain("GENERATED FILE. Source: /{$source}");
    }
});

it('publishes only the tested API documentation subset', function (): void {
    $apiDirectory = base_path('docs/src/content/docs/api');
    $content = collect(glob($apiDirectory.'/*.mdx') ?: [])
        ->map(fn (string $file): string => file_get_contents($file) ?: '')
        ->implode("\n");

    expect($content)
        ->toContain('GET /api/v1/public/settings')
        ->toContain('GET /api/settings')
        ->toContain('POST /api/students/verify')
        ->not->toContain('GET /api/students ')
        ->not->toContain('POST /api/students ')
        ->not->toContain('PUT /api/students/')
        ->not->toContain('DELETE /api/students/')
        ->and(file_exists($apiDirectory.'/student-api.mdx'))->toBeFalse();
});
