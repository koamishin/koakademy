<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Route;

test('passkey options endpoint returns options without email (discoverable credentials)', function () {
    $response = $this->postJson('/passkeys/options', []);

    $response->assertOk()
        ->assertJsonStructure([
            'options' => [
                'challenge',
            ],
        ]);

    // Without email, allowCredentials should be empty for discoverable credentials
    $options = $response->json('options');
    expect($options['allowCredentials'])->toBeEmpty();
});

test('passkey options endpoint returns 404 for non-existent user when email provided', function () {
    $response = $this->postJson('/passkeys/options', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertNotFound()
        ->assertJson(['error' => 'User not found.']);
});

test('passkey options endpoint returns options for valid user with passkey', function () {
    $user = User::factory()->create();

    $credentialId = mb_rtrim(strtr(base64_encode('test-credential-'.$user->id), '+/', '-_'), '=');

    $user->passkeys()->create([
        'name' => 'Test Passkey',
        'credential_id' => $credentialId,
        'credential' => ['publicKeyCredentialId' => $credentialId],
    ]);

    $response = $this->postJson('/passkeys/options', [
        'email' => $user->email,
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'options' => [
                'challenge',
            ],
        ]);
});

test('passkey login endpoint requires passkey parameter', function () {
    $response = $this->postJson('/passkeys/login', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['passkey']);
});

test('passkey login endpoint returns error when no options in session', function () {
    $response = $this->postJson('/passkeys/login', [
        'passkey' => json_encode(['id' => 'test', 'type' => 'public-key']),
    ]);

    $response->assertBadRequest()
        ->assertJson(['error' => 'Authentication options not found or expired.']);
});

test('passkey routes are accessible without domain restriction', function () {
    // Test that the app's custom passkey routes exist and don't require a specific domain.
    $routes = collect(['passkeys.login.options', 'passkeys.login.verify'])
        ->map(fn (string $name) => Route::getRoutes()->getByName($name));

    expect($routes)->not->toContain(null);
    $routes->each(fn ($route) => expect($route->getDomain())->toBeNull());
});
