<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Searchable Model Directories
    |--------------------------------------------------------------------------
    |
    | Define the directories for Laravel Scout to scan for models that use the
    | Searchable trait. This configuration accepts an array of directory paths
    | where your models reside. Glob patterns are supported for these paths,
    | allowing you to include multiple directories. Laravel Scout Bulk
    | Actions will automatically import or flush these models.
    |
    */

    'model_directories' => [
        app_path('Models'),
        ...glob(base_path('Modules/*/Models')) ?: [],
    ],
];
