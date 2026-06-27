<?php

declare(strict_types=1);

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Gate;

uses()->group('station');

test('station config isolates pdf generation into dedicated supervisor', function (): void {
    $supervisors = config('station.supervisors');

    expect($supervisors)->toHaveKey('default')
        ->and($supervisors)->toHaveKey('pdf');

    expect($supervisors['default']['queues'])->toBe(['default', 'assessments'])
        ->and($supervisors['pdf']['queues'])->toBe(['pdf-generation']);
});

test('pdf supervisor uses dedicated redis connection with elevated timeout and memory', function (): void {
    $pdfSupervisor = config('station.supervisors.pdf');

    expect($pdfSupervisor['connection'])->toBe('redis-pdf')
        ->and($pdfSupervisor['timeout'])->toBe(3600)
        ->and($pdfSupervisor['memory'])->toBe(2048)
        ->and($pdfSupervisor['balance'])->toBe('auto');
});

test('pdf queue connection has retry_after greater than longest job timeout', function (): void {
    $pdfConnection = config('queue.connections.redis-pdf');

    expect($pdfConnection)->not->toBeNull();
    expect($pdfConnection['driver'])->toBe('station-redis');
    expect($pdfConnection['connection'])->toBe('queue-pdf');
    expect($pdfConnection['retry_after'])->toBe(7200);
});

test('station dashboard is guarded by the station authorization gate', function (): void {
    expect(config('station.dashboard.authorization'))->toBe('viewStation');

    $user = new App\Models\User(['role' => App\Enums\UserRole::SuperAdmin]);
    $admin = new App\Models\User(['role' => App\Enums\UserRole::Admin]);
    $student = new App\Models\User(['role' => App\Enums\UserRole::Student]);

    expect(Gate::forUser($user)->allows('viewStation'))->toBeTrue()
        ->and(Gate::forUser($admin)->allows('viewStation'))->toBeFalse()
        ->and(Gate::forUser($student)->allows('viewStation'))->toBeFalse();
});

test('station maintenance is scheduled without horizon snapshot', function (): void {
    /** @var Schedule $schedule */
    $schedule = app(Schedule::class);

    $stationPruneFound = false;
    $horizonSnapshotFound = false;

    foreach ($schedule->events() as $event) {
        $command = $event->command ?? '';

        if (str_contains($command, 'station:prune')) {
            $stationPruneFound = true;
            expect($event->expression)->toBe('0 0 * * *');
        }

        if (str_contains($command, 'horizon:snapshot')) {
            $horizonSnapshotFound = true;
        }
    }

    expect($stationPruneFound)->toBeTrue('station:prune should be scheduled')
        ->and($horizonSnapshotFound)->toBeFalse('horizon:snapshot should not be scheduled');
});
