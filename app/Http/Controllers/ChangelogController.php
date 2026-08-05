<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use App\Services\VersionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

final class ChangelogController extends Controller
{
    /**
     * Display the changelog page.
     *
     * This page is publicly accessible - users do not need to be authenticated.
     */
    public function __invoke(Request $request, VersionService $versionService): Response
    {
        $user = Auth::user();
        $canAccessAdminPortal = $user?->canAccessAdminPortal() ?? false;

        // Resolve the configured GitHub source for the release history. This
        // application ships from yukazakiri/koakademy; the value is overridable
        // through the `services.github.repo` configuration key.
        $githubRepo = config('services.github.repo', 'yukazakiri/koakademy');
        $githubToken = config('services.github.token');

        // The deployment workflow publishes every application update as a
        // pre-release, so these entries are part of the public product history.
        $changelog = (new ChangelogService($githubRepo, $githubToken))
            ->getChangelog(30, includePrereleases: true);

        // Get version info for the current release
        $versionInfo = $versionService->getVersionInfo();
        $version = config('app.version', '1.0.0');

        if (! $canAccessAdminPortal) {
            $versionInfo['commit'] = null;
            $versionInfo['build_url'] = null;
        }

        $changelogSource = $changelog->isEmpty() ? 'build_metadata' : 'github_releases';

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
            'changelog_source' => $changelogSource,
            'show_technical_links' => $canAccessAdminPortal,
            'github_repo' => $canAccessAdminPortal
                ? $githubRepo
                : null,
        ]);
    }

    /**
     * Build a useful release entry when GitHub releases are unavailable.
     *
     * @param  array{version: string, release_type: string, commit: string|null, build_url: string|null, timestamp: string|null, is_latest: bool}  $versionInfo
     * @return array{title: string, version: string, date: string, published_at: string|null, type: string, prerelease: bool, source: string, changes: array<int, array{type: string, description: string}>, github_url: null}
     */
    private function fallbackEntry(array $versionInfo, string $version): array
    {
        return [
            'title' => 'Current deployed build',
            'version' => $versionInfo['version'] ?? $version,
            'date' => $this->fallbackDate($versionInfo['timestamp']),
            'published_at' => $versionInfo['timestamp'],
            'type' => $versionInfo['release_type'] ?? 'patch',
            'prerelease' => str_contains($versionInfo['version'] ?? $version, '-'),
            'source' => 'build_metadata',
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
        } catch (Throwable) {
            return now()->format('F j, Y');
        }
    }
}
