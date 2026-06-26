<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

function dockerStartupPosixShell(): ?string
{
    static $resolved = false;
    static $shell = null;

    if ($resolved) {
        return $shell;
    }

    $resolved = true;
    $candidates = array_filter([
        getenv('POSIX_SHELL') ?: null,
        'sh',
        '/bin/sh',
        'C:\\Program Files\\Git\\bin\\sh.exe',
        'C:\\Program Files\\Git\\usr\\bin\\sh.exe',
    ]);

    foreach ($candidates as $candidate) {
        $process = new Process([$candidate, '-c', 'exit 0'], base_path());
        $process->run();

        if ($process->isSuccessful()) {
            $shell = $candidate;

            return $shell;
        }
    }

    return null;
}

function pathForPosixShell(string $path): string
{
    return str_replace('\\', '/', $path);
}

function runStartContainerRedisRequirement(array $environment, string $shell): string
{
    $script = file_get_contents(base_path('docker/start-container'));
    $prefix = mb_strstr($script, "\nif [ \"\$1\" != \"\" ]; then", true);

    expect($prefix)->not->toBeFalse('Unable to isolate docker/start-container function definitions.');

    $testScript = storage_path('framework/testing/start-container-redis-check.sh');
    @mkdir(dirname($testScript), 0777, true);

    file_put_contents($testScript, $prefix."\nif is_redis_required; then\n    echo required\nelse\n    echo skipped\nfi\n");

    $process = new Process([$shell, pathForPosixShell($testScript)], base_path(), $environment);
    $process->run();

    expect($process->isSuccessful())->toBeTrue($process->getErrorOutput() ?: $process->getOutput());

    return mb_trim($process->getOutput());
}

test('docker startup scripts are valid posix shell', function (): void {
    $shell = dockerStartupPosixShell();

    if ($shell === null) {
        $this->markTestSkipped('A POSIX shell is not available.');
    }

    $scripts = [
        base_path('docker/start-container'),
        base_path('docker/docker-scripts/scout-index.sh'),
        base_path('docker/run-scripts.sh'),
    ];

    foreach ($scripts as $script) {
        $process = new Process([$shell, '-n', pathForPosixShell($script)], base_path());
        $process->run();

        expect($process->isSuccessful())
            ->toBeTrue($process->getErrorOutput() ?: $process->getOutput());
    }
});

test('primary-only startup tasks stay scoped to the http container', function (): void {
    $script = file_get_contents(base_path('docker/start-container'));

    expect($script)->toContain('run_primary_startup_tasks');
    expect($script)->toContain('if is_primary_container; then');
    expect($script)->toContain('FORCE_OPTIMIZE_CLEAR');
    expect($script)->toContain('RUN_OPTIMIZE');
});

test('docker startup does not import scout records', function (): void {
    $script = file_get_contents(base_path('docker/start-container'));

    expect($script)->toContain('schedule_scout_settings_post_start');
    expect($script)->toContain('scout:sync-index-settings');
    expect($script)->not->toContain('docker/docker-scripts/scout-index.sh');
    expect($script)->not->toContain('scout:import');
    expect($script)->not->toContain('RUN_SCOUT_IMPORT=${');
    expect($script)->not->toContain('SCOUT_IMPORT_QUEUE');
});

test('docker startup dependency checks are driven by configured services', function (): void {
    $script = file_get_contents(base_path('docker/start-container'));

    expect($script)->toContain('resolve_database_connection()');
    expect($script)->toContain('is_database_connection_networked()');
    expect($script)->toContain('case "${database_connection}" in');
    expect($script)->toContain('sqlite)');
    expect($script)->toContain('Skipping Database network check (DB_CONNECTION=${database_connection}).');
    expect($script)->toContain('resolve_database_connection');
    expect($script)->toContain('if is_database_connection_networked; then');
    expect($script)->toContain('Skipping Redis check (no Redis-backed services configured).');
});

test('docker startup does not require redis for default laravel services with pulse redis ingest', function (): void {
    $shell = dockerStartupPosixShell();

    if ($shell === null) {
        $this->markTestSkipped('A POSIX shell is not available.');
    }

    expect(runStartContainerRedisRequirement([
        'QUEUE_CONNECTION' => 'sync',
        'CACHE_STORE' => 'database',
        'SESSION_DRIVER' => 'database',
        'PULSE_ENABLED' => 'true',
        'PULSE_INGEST_DRIVER' => 'redis',
    ], $shell))->toBe('skipped');
});

test('docker startup still requires redis for redis backed application services', function (): void {
    $shell = dockerStartupPosixShell();

    if ($shell === null) {
        $this->markTestSkipped('A POSIX shell is not available.');
    }

    expect(runStartContainerRedisRequirement([
        'QUEUE_CONNECTION' => 'sync',
        'CACHE_STORE' => 'redis',
        'SESSION_DRIVER' => 'database',
        'PULSE_ENABLED' => 'true',
        'PULSE_INGEST_DRIVER' => 'storage',
    ], $shell))->toBe('required');
});

test('docker startup migrations seed demo environments', function (): void {
    $script = file_get_contents(base_path('docker/start-container'));

    expect($script)->toContain('if [ "${app_env}" = "demo" ]; then');
    expect($script)->toContain('php artisan migrate --seed --force --no-interaction');
    expect($script)->toContain('php artisan migrate --force --no-interaction');
});

test('scout indexing script stays portable and configurable', function (): void {
    $script = file_get_contents(base_path('docker/docker-scripts/scout-index.sh'));

    expect($script)->not->toContain('local ');
    expect($script)->toContain('SCOUT_INDEX_MODELS');
    expect($script)->toContain('class_uses_recursive');
});

test('site settings defines a safe default for auth layout', function (): void {
    $settingsClass = file_get_contents(base_path('app/Settings/SiteSettings.php'));

    expect($settingsClass)->toContain("private const string DEFAULT_AUTH_LAYOUT = 'split';");
    expect($settingsClass)->toContain('public ?string $auth_layout = self::DEFAULT_AUTH_LAYOUT;');
});

test('docker startup creates missing vendor view directories', function (): void {
    $script = file_get_contents(base_path('docker/start-container'));

    expect($script)->toContain('ensure_vendor_view_dirs');
    expect($script)->toContain('vendor/moataz-01/filament-notification-sound/resources/views');
    expect($script)->toContain('vendor/alizharb/laravel-modular/resources/views');
    expect($script)->toContain('mkdir -p "${module_dir}/resources/views"');
});

test('laravel modular resolves the repository modules directory', function (): void {
    $config = require base_path('config/modular.php');

    expect($config['paths']['modules'])
        ->toBe(base_path('Modules'));
});
