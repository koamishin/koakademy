<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Laravel\Passkeys\Actions\DeletePasskey;
use Laravel\Passkeys\Actions\GenerateRegistrationOptions;
use Laravel\Passkeys\Actions\StorePasskey;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\Passkey;
use Laravel\Passkeys\Support\WebAuthn;
use Throwable;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;

final class PasskeyController extends Controller
{
    private const REGISTRATION_OPTIONS_SESSION_KEY = 'passkey.registration_options';

    public function generateRegistrationOptions(Request $request, GenerateRegistrationOptions $generate): JsonResponse
    {
        $this->configurePasskeysForRequest($request);

        $options = $generate($this->currentUser());

        $request->session()->put(self::REGISTRATION_OPTIONS_SESSION_KEY, WebAuthn::toJson($options));

        return response()->json([
            'options' => json_decode(WebAuthn::toJson($options), true),
        ]);
    }

    public function store(Request $request, StorePasskey $storePasskey): RedirectResponse|JsonResponse
    {
        $request->validate([
            'passkey' => ['required_without:credential', 'string'],
            'credential' => ['nullable', 'array'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $this->configurePasskeysForRequest($request);

        $serializedOptions = $request->session()->pull(self::REGISTRATION_OPTIONS_SESSION_KEY);

        if (! is_string($serializedOptions) || $serializedOptions === '') {
            return $this->passkeyError($request, 'Registration options not found or expired.');
        }

        try {
            $storePasskey(
                $this->currentUser(),
                $request->string('name')->toString(),
                $this->credentialFromRequest($request),
                WebAuthn::fromJson($serializedOptions, PublicKeyCredentialCreationOptions::class),
            );

            return back()->with('flash', [
                'success' => 'Passkey added successfully.',
            ]);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            return $this->passkeyError($request, 'Failed to add passkey: '.$exception->getMessage());
        }
    }

    public function destroy(Request $request, DeletePasskey $deletePasskey, int|string $id): RedirectResponse
    {
        $user = $this->currentUser();

        /** @var Passkey $passkey */
        $passkey = $user->passkeys()->whereKey($id)->firstOrFail();

        $deletePasskey($user, $passkey);

        return back()->with('flash', [
            'success' => 'Passkey deleted successfully.',
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $passkeys = $this->currentUser()
            ->passkeys()
            ->select(['id', 'name', 'created_at', 'last_used_at'])
            ->get();

        return response()->json([
            'passkeys' => $passkeys,
        ]);
    }

    private function currentUser(): Authenticatable&PasskeyUser
    {
        $user = Auth::user();

        abort_unless($user instanceof Authenticatable && $user instanceof PasskeyUser, 403);

        return $user;
    }

    private function configurePasskeysForRequest(Request $request): void
    {
        config([
            'passkeys.relying_party_id' => $request->getHost(),
            'passkeys.allowed_origins' => [$request->getSchemeAndHttpHost()],
        ]);
    }

    private function credentialFromRequest(Request $request): PublicKeyCredential
    {
        $credential = $request->input('credential');

        if (! is_array($credential) && is_string($request->input('passkey'))) {
            $credential = json_decode((string) $request->input('passkey'), true);
        }

        if (! is_array($credential)) {
            throw ValidationException::withMessages([
                'credential' => __('Invalid credential format.'),
            ]);
        }

        try {
            return WebAuthn::fromJson(
                json_encode($credential, JSON_THROW_ON_ERROR),
                PublicKeyCredential::class,
            );
        } catch (Throwable) {
            throw ValidationException::withMessages([
                'credential' => __('Invalid credential format.'),
            ]);
        }
    }

    private function passkeyError(Request $request, string $message): RedirectResponse|JsonResponse
    {
        if ($request->expectsJson()) {
            return response()->json(['error' => $message], 400);
        }

        return back()->withErrors(['error' => $message]);
    }
}
