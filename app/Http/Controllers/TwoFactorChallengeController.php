<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Filament\Auth\MultiFactor\SecurityAwareAppAuthentication;
use App\Filament\Auth\MultiFactor\SecurityAwareEmailAuthentication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\LaravelPasskeys\Actions\FindPasskeyToAuthenticateAction;
use Spatie\LaravelPasskeys\Support\Config;
use Spatie\LaravelPasskeys\Support\Serializer;
use Throwable;
use Webauthn\PublicKeyCredentialRequestOptions;

final class TwoFactorChallengeController extends Controller
{
    public function __construct(
        private readonly SecurityAwareAppAuthentication $appAuthentication,
        private readonly SecurityAwareEmailAuthentication $emailAuthentication,
    ) {}

    public function create(Request $request)
    {
        if (! $request->session()->has('auth.2fa.id')) {
            return redirect()->route('login');
        }

        $user = User::find($request->session()->get('auth.2fa.id'));

        if (! $user) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge', [
            'has_app_auth' => $this->appAuthentication->isEnabled($user),
            'has_email_auth' => $this->emailAuthentication->isEnabled($user),
            'has_passkeys' => $user->passkeys()->exists(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'nullable|string',
            'recovery_code' => 'nullable|string',
        ]);

        if (! $request->session()->has('auth.2fa.id')) {
            return redirect()->route('login');
        }

        $user = User::find($request->session()->get('auth.2fa.id'));

        if (! $user) {
            return redirect()->route('login');
        }

        if ($request->filled('recovery_code')) {
            if ($this->appAuthentication->isEnabled($user) && $this->verifyRecoveryCode($user, $request->recovery_code)) {
                return $this->loginUser($request, $user);
            }

            return back()->withErrors(['recovery_code' => 'The provided recovery code was invalid.']);
        }

        $code = $request->code;

        if (blank($code)) {
            return back()->withErrors(['code' => 'The authentication code is required.']);
        }

        if ($this->appAuthentication->isEnabled($user)) {
            $secret = $user->getAppAuthenticationSecret();

            if (filled($secret) && $this->appAuthentication->verifyCode($code, $secret, shouldPreventCodeReuse: true)) {
                return $this->loginUser($request, $user);
            }
        }

        if ($this->emailAuthentication->isEnabled($user) && $this->emailAuthentication->verifyCode($code)) {
            return $this->loginUser($request, $user);
        }

        return back()->withErrors(['code' => 'The provided authentication code was invalid.']);
    }

    public function sendEmailCode(Request $request)
    {
        if (! $request->session()->has('auth.2fa.id')) {
            return redirect()->route('login');
        }
        $user = User::find($request->session()->get('auth.2fa.id'));

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $this->emailAuthentication->isEnabled($user)) {
            return back()->withErrors(['code' => 'Email authentication is not enabled for this account.']);
        }

        if (! $this->emailAuthentication->sendCode($user)) {
            return back()->withErrors(['code' => 'Please wait before requesting another email code.']);
        }

        return back()->with('flash', ['success' => 'Code sent to your email.']);
    }

    /**
     * Generate WebAuthn authentication options for the user in the 2FA session.
     */
    public function passkeyOptions(Request $request): JsonResponse
    {
        if (! $request->session()->has('auth.2fa.id')) {
            return response()->json(['error' => 'No active two-factor session.'], 403);
        }

        $user = User::find($request->session()->get('auth.2fa.id'));

        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        $passkeys = $user->passkeys;

        if ($passkeys->isEmpty()) {
            return response()->json(['error' => 'No passkeys registered.'], 404);
        }

        // Dynamic RP ID to match current domain
        config(['passkeys.relying_party.id' => $request->getHost()]);
        config(['app.url' => $request->getSchemeAndHttpHost()]);

        // Use discoverable credential flow (empty allowCredentials) to avoid
        // credential ID encoding issues. The passkey ownership is verified
        // server-side in passkeyVerify() after the ceremony completes.
        $options = new PublicKeyCredentialRequestOptions(
            challenge: Str::random(32),
            rpId: Config::getRelyingPartyId(),
            allowCredentials: [],
            userVerification: 'preferred',
        );

        $serializedOptions = Serializer::make()->toJson($options);
        $request->session()->put('passkey-authentication-options', $serializedOptions);

        return response()->json([
            'options' => json_decode($serializedOptions),
        ]);
    }

    /**
     * Verify a passkey assertion during the 2FA challenge and complete login.
     */
    public function passkeyVerify(Request $request): JsonResponse
    {
        $request->validate([
            'passkey' => 'required|string',
        ]);

        if (! $request->session()->has('auth.2fa.id')) {
            return response()->json(['error' => 'No active two-factor session.'], 403);
        }

        $user = User::find($request->session()->get('auth.2fa.id'));

        if (! $user) {
            return response()->json(['error' => 'User not found.'], 404);
        }

        // Dynamic RP ID to match current domain
        config(['passkeys.relying_party.id' => $request->getHost()]);
        config(['app.url' => $request->getSchemeAndHttpHost()]);

        $options = $request->session()->pull('passkey-authentication-options');

        if (! $options) {
            return response()->json(['error' => 'Authentication options not found or expired.'], 400);
        }

        $findPasskeyAction = Config::getAction('find_passkey', FindPasskeyToAuthenticateAction::class);

        try {
            $passkeyModel = $findPasskeyAction->execute(
                $request->input('passkey'),
                $options
            );

            if (! $passkeyModel || $passkeyModel->authenticatable_id !== $user->id) {
                return response()->json(['error' => 'Passkey verification failed.'], 400);
            }

            Auth::login($user, $request->session()->get('auth.2fa.remember', false));
            $request->session()->forget('auth.2fa.id');
            $request->session()->forget('auth.2fa.remember');
            $request->session()->regenerate();

            $defaultRedirect = $user->isAdministrative()
                ? '/administrators'
                : '/dashboard';

            return response()->json(['url' => $defaultRedirect]);
        } catch (Throwable $e) {
            return response()->json(['error' => 'Passkey verification failed: '.$e->getMessage()], 400);
        }
    }

    private function verifyRecoveryCode(User $user, string $recoveryCode): bool
    {
        try {
            if ($this->appAuthentication->verifyRecoveryCode($recoveryCode, $user)) {
                return true;
            }
        } catch (Throwable) {
            // Fall through to legacy recovery code handling below.
        }

        $recoveryCodes = $user->app_authentication_recovery_codes;

        if (! is_array($recoveryCodes) || ! in_array($recoveryCode, $recoveryCodes, true)) {
            return false;
        }

        $user->app_authentication_recovery_codes = array_values(array_diff($recoveryCodes, [$recoveryCode]));
        $user->save();

        return true;
    }

    private function loginUser(Request $request, User $user)
    {
        Auth::login($user, $request->session()->get('auth.2fa.remember', false));
        $request->session()->forget('auth.2fa.id');
        $request->session()->forget('auth.2fa.remember');
        $request->session()->regenerate();

        $defaultRedirect = $user instanceof User && $user->isAdministrative()
                ? '/administrators'
                : '/dashboard';

        return redirect()->intended($defaultRedirect);
    }
}
