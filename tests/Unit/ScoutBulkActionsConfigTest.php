<?php

declare(strict_types=1);

it('configures scout bulk actions to scan existing model directories', function (): void {
    $config = require base_path('config/scout-bulk-actions.php');

    expect($config['model_directories'])
        ->toContain(app_path('Models'))
        ->each->toBeDirectory();
});
