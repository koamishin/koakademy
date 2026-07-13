<?php

declare(strict_types=1);

use App\Jobs\GenerateAssessmentPdfJob;

it('routes assessment PDF generation to the dedicated PDF workers', function (): void {
    config([
        'queue.default' => 'redis',
        'queue.assessment_notification_connection' => 'redis-pdf',
    ]);

    $job = new GenerateAssessmentPdfJob(1234, 'queue-routing-test');

    expect($job->connection)->toBe('redis-pdf')
        ->and($job->queue)->toBe('pdf-generation');
});
