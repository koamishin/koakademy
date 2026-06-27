<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use App\Services\VersionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class ChangelogController extends Controller
{
    /**
     * Display the changelog page.
     *
     * This page is publicly accessible - users do not need to be authenticated.
     */
    public function __invoke(Request $request, ChangelogService $changelogService, VersionService $versionService): Response
    {
        $user = Auth::user();
        $canAccessAdminPortal = $user?->canAccessAdminPortal() ?? false;

        // Authenticated users can see development and beta releases. Public
        // visitors only see stable releases.
        $changelog = $changelogService->getChangelog(20, includePrereleases: $user !== null);

        // Get version info for the current release
        $versionInfo = $versionService->getVersionInfo();
        $version = config('app.version', '1.0.0');

        if ($changelog->isEmpty()) {
            $changelog = collect([$this->fallbackEntry($versionInfo, $version)]);
        }

        return Inertia::render('changelog', [
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar_url ?? null,
                'role' => $user->role?->getLabel() ?? 'User',
            ] : [
                'name' => 'Guest',
                'email' => '',
                'avatar' => null,
                'role' => 'guest',
            ],
            'layout' => $canAccessAdminPortal ? 'admin' : 'portal',
            'version' => $version,
            'versionInfo' => $versionInfo,
            'changelog' => $changelog->toArray(),
            'github_repo' => config('services.github.repo', 'dccp-developers/DccpAdminV3'),
        ]);
    }

    /**
     * Build a useful release entry when GitHub releases are unavailable.
     *
     * @param  array{version: string, release_type: string, commit: string|null, build_url: string|null, timestamp: string|null, is_latest: bool}  $versionInfo
     * @return array{version: string, date: string, type: string, changes: array<int, array{type: string, description: string}>, github_url: null}
     */
    private function fallbackEntry(array $versionInfo, string $version): array
    {
        return [
            'version' => $versionInfo['version'] ?? $version,
            'date' => $this->fallbackDate($versionInfo['timestamp']),
            'type' => $versionInfo['release_type'] ?? 'patch',
            'changes' => [
                [
                    'type' => 'improvement',
                    'description' => 'Current application version from the deployed build metadata.',
                ],
            ],
            'github_url' => null,
        ];
    }

    private function fallbackDate(?string $timestamp): string
    {
        if (! $timestamp) {
            return now()->format('F j, Y');
        }

        try {
            return \Carbon\Carbon::parse($timestamp)->format('F j, Y');
        } catch (\Throwable) {
            return now()->format('F j, Y');
        }
    }
}
