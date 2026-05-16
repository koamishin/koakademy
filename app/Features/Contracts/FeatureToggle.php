<?php

declare(strict_types=1);

namespace App\Features\Contracts;

use App\Models\User;
use Illuminate\Support\Lottery;

interface FeatureToggle
{
    /** Unique identifier, used as Pennant feature name */
    public function key(): string;

    /** Human-readable name shown in admin UI */
    public function name(): string;

    /** Short description */
    public function summary(): ?string;

    /** Target audience: student, faculty, all */
    public function audience(): string;

    /** Optional badge label */
    public function badge(): ?string;

    /** Optional Tailwind accent class */
    public function accent(): ?string;

    /** Optional CTA button label */
    public function ctaLabel(): ?string;

    /** Optional CTA URL */
    public function ctaUrl(): ?string;

    /** Onboarding/walkthrough steps (optional) */
    public function steps(): array;

    /** Default resolution: should this user see the feature? */
    public function resolve(User $scope): bool;

    /** Optional lottery for incremental rollout */
    public function lottery(): ?Lottery;

    /** Category for grouping in admin UI */
    public function category(): string;
}
