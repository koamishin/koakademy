<?php

declare(strict_types=1);

return [
    'name' => 'LibrarySystem',
    'ebooks' => [
        'disk' => 'library',
        'max_upload_kilobytes' => (int) env('LIBRARY_EBOOK_MAX_KB', 92160),
        'reader_url_minutes' => (int) env('LIBRARY_READER_URL_MINUTES', 60),
        'download_url_minutes' => (int) env('LIBRARY_DOWNLOAD_URL_MINUTES', 5),
        'takedown_email' => env('LIBRARY_TAKEDOWN_EMAIL'),
    ],
];
