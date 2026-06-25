<?php

declare(strict_types=1);

function loggingConfigForStack(string $stack): array
{
    $previous = [
        'getenv' => getenv('LOG_STACK'),
        'env' => $_ENV['LOG_STACK'] ?? null,
        'server' => $_SERVER['LOG_STACK'] ?? null,
    ];

    putenv("LOG_STACK={$stack}");
    $_ENV['LOG_STACK'] = $stack;
    $_SERVER['LOG_STACK'] = $stack;

    try {
        return require base_path('config/logging.php');
    } finally {
        if ($previous['getenv'] === false) {
            putenv('LOG_STACK');
        } else {
            putenv("LOG_STACK={$previous['getenv']}");
        }

        if ($previous['env'] === null) {
            unset($_ENV['LOG_STACK']);
        } else {
            $_ENV['LOG_STACK'] = $previous['env'];
        }

        if ($previous['server'] === null) {
            unset($_SERVER['LOG_STACK']);
        } else {
            $_SERVER['LOG_STACK'] = $previous['server'];
        }
    }
}

test('log stack never includes itself', function (): void {
    $config = loggingConfigForStack('stack, laraowl, single, stack');

    expect($config['channels']['stack']['channels'])
        ->toBe(['laraowl', 'single']);
});

test('log stack falls back to single when only self reference is configured', function (): void {
    $config = loggingConfigForStack('stack');

    expect($config['channels']['stack']['channels'])
        ->toBe(['single']);
});
