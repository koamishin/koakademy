<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\OnlineUserPresenceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

it('reads recent unique users from the configured session connection and table', function (): void {
    config()->set('session.driver', 'database');
    config()->set('session.connection', config('database.default'));
    config()->set('session.table', 'sessions');

    $onlineUser = User::factory()->create();
    $duplicateSessionUser = User::factory()->create();
    $offlineUser = User::factory()->create();

    foreach ([
        [$onlineUser->id, now()->timestamp],
        [$duplicateSessionUser->id, now()->timestamp],
        [$duplicateSessionUser->id, now()->subMinute()->timestamp],
        [$offlineUser->id, now()->subMinutes(16)->timestamp],
    ] as [$userId, $lastActivity]) {
        DB::table('sessions')->insert([
            'id' => Str::uuid()->toString(),
            'user_id' => $userId,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Pest',
            'payload' => '',
            'last_activity' => $lastActivity,
        ]);
    }

    $onlineUserIds = app(OnlineUserPresenceService::class)->onlineUserIds();

    expect($onlineUserIds)
        ->toHaveCount(2)
        ->toContain($onlineUser->id, $duplicateSessionUser->id)
        ->not->toContain($offlineUser->id);
});

it('returns no fallback users for an unsupported session driver', function (): void {
    config()->set('session.driver', 'cookie');

    expect(app(OnlineUserPresenceService::class)->onlineUserIds())->toBe([]);
});
