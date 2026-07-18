<?php

declare(strict_types=1);

use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Scout\Searchable;

it('makes the soft delete marker filterable for every searchable soft-deletable model', function (): void {
    $config = require base_path('config/scout.php');
    $indexSettings = $config['meilisearch']['index-settings'];

    foreach (glob(app_path('Models/*.php')) as $file) {
        $model = 'App\\Models\\'.basename($file, '.php');

        if (! class_exists($model)) {
            continue;
        }

        $traits = class_uses_recursive($model);

        if (! in_array(Searchable::class, $traits, true) || ! in_array(SoftDeletes::class, $traits, true)) {
            continue;
        }

        expect($indexSettings)
            ->toHaveKey($model)
            ->and($indexSettings[$model]['filterableAttributes'] ?? [])
            ->toContain('__soft_deleted');
    }
});
