<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Pennant\Feature;

/**
 * Service for managing feature toggle state via Pennant.
 * Handles global activation, deactivation, and per-user overrides.
 */
final class FeatureToggleService
{
    /**
     * Activate a feature globally (for everyone).
     */
    public function activateGlobally(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::activateForEveryone($featureRef);
    }

    /**
     * Deactivate a feature globally (for everyone).
     */
    public function deactivateGlobally(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::deactivateForEveryone($featureRef);
    }

    /**
     * Activate a feature for a specific user.
     */
    public function activateForUser(string $featureKey, User $user): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::for($user)->activate($featureRef);
    }

    /**
     * Deactivate a feature for a specific user.
     */
    public function deactivateForUser(string $featureKey, User $user): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::for($user)->deactivate($featureRef);
    }

    /**
     * Purge all per-user overrides for a feature.
     */
    public function purgeOverrides(string $featureKey): void
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);
        $featureRef = $featureClass ?? $featureKey;

        Feature::forget($featureRef);
    }

    /**
     * Check if a feature is globally activated.
     */
    public function isGloballyActivated(string $featureKey): bool
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return false;
        }

        return DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', '__laravel_null')
            ->where('value', 'true')
            ->exists();
    }

    /**
     * Count users with explicit overrides for a feature.
     */
    public function getUserOverrideCount(string $featureKey): int
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return 0;
        }

        return DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', 'not like', '%__laravel_null%')
            ->count();
    }

    /**
     * Get users with explicit overrides for a feature.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getOverriddenUsers(string $featureKey): array
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return [];
        }

        $userScopes = DB::table('features')
            ->where('name', $featureClass)
            ->where('scope', 'not like', '%__laravel_null%')
            ->pluck('scope')
            ->all();

        $userIds = collect($userScopes)
            ->map(fn (string $scope) => Str::afterLast($scope, '|'))
            ->filter()
            ->map(fn (string $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();

        return User::query()
            ->whereIn('id', $userIds)
            ->get()
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->value,
                'is_active' => Feature::for($user)->active($featureClass),
            ])
            ->all();
    }

    /**
     * Get the current state of a feature for admin display.
     *
     * @return array<string, mixed>
     */
    public function getFeatureState(string $featureKey): array
    {
        $featureClass = FeatureToggleRegistry::classForKey($featureKey);

        if ($featureClass === null) {
            return [
                'is_globally_activated' => false,
                'override_count' => 0,
                'has_class' => false,
            ];
        }

        return [
            'is_globally_activated' => $this->isGloballyActivated($featureKey),
            'override_count' => $this->getUserOverrideCount($featureKey),
            'has_class' => true,
        ];
    }
}
