<?php

declare(strict_types=1);

namespace Modules\Announcement\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Modules\Announcement\Models\Announcement;

final class AnnouncementDataService
{
    public function paginateForAdministration(int $perPage = 15): LengthAwarePaginator
    {
        return Announcement::query()
            ->with('creator:id,name')
            ->latest()
            ->paginate($perPage)
            ->through(fn (Announcement $announcement): array => $this->mapForAdministration($announcement));
    }

    /**
     * @return array<int, array{id: int, title: string, content: string, type: string, priority: string, date: string, is_read: bool}>
     */
    public function getPortalIndexData(): array
    {
        return $this->applyPortalOrdering($this->visibleQuery())
            ->get()
            ->map(fn (Announcement $announcement): array => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'type' => (string) ($announcement->type ?? 'info'),
                'priority' => (string) ($announcement->priority ?? 'medium'),
                'date' => ($announcement->published_at ?? $announcement->created_at)?->format('M d, Y') ?? '',
                'is_read' => false,
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, title: string, content: string, date: string, type: string}>
     */
    public function getDashboardItems(int $limit = 5): array
    {
        return $this->applyPortalOrdering($this->visibleQuery())
            ->limit($limit)
            ->get()
            ->map(fn (Announcement $announcement): array => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => Str::of(strip_tags($announcement->content))->squish()->toString(),
                'date' => ($announcement->published_at ?? $announcement->created_at)?->format('M d, Y') ?? '',
                'type' => (string) ($announcement->type ?? 'info'),
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, title: string, content: string, type: string, priority: string, display_mode: string, requires_acknowledgment: bool, link: string|null, is_active: bool, starts_at: string|null, ends_at: string|null}>
     */
    public function getSharedBannerAnnouncements(?User $user = null, string $location = 'all'): array
    {
        return $this->applyBannerOrdering($this->visibleQuery())
            ->get()
            ->filter(fn (Announcement $announcement): bool => $this->matchesAudience($announcement, $user))
            ->filter(fn (Announcement $announcement): bool => $this->matchesLocation($announcement, $location))
            ->map(fn (Announcement $announcement): array => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'type' => (string) ($announcement->type ?? 'info'),
                'priority' => (string) ($announcement->priority ?? 'medium'),
                'display_mode' => (string) ($announcement->display_mode ?? 'banner'),
                'requires_acknowledgment' => (bool) $announcement->requires_acknowledgment,
                'link' => $announcement->link,
                'action_label' => $announcement->action_label,
                'is_active' => $announcement->isActive(),
                'starts_at' => $announcement->starts_at?->toIso8601String(),
                'ends_at' => ($announcement->ends_at ?? $announcement->expires_at)?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getTemplates(): array
    {
        return [
            [
                'key' => 'enrollment-open',
                'title' => 'Enrollment is now open',
                'content' => 'Enrollment for the upcoming term is now open. Submit your requirements before the stated deadline.',
                'type' => 'enrollment',
                'priority' => 'high',
                'display_mode' => 'banner',
                'link' => '/enrollment',
                'action_label' => 'Enroll now',
                'visibility_scope' => 'global',
                'audience_roles' => ['guest', 'authenticated', 'student', 'faculty'],
                'display_locations' => ['enrollment', 'login', 'signup', 'student_layout', 'faculty_layout'],
            ],
            [
                'key' => 'class-suspension',
                'title' => 'Class Suspension Advisory',
                'content' => 'Classes are suspended today due to weather conditions. Please wait for further updates from the administration.',
                'type' => 'warning',
                'priority' => 'urgent',
                'display_mode' => 'banner',
                'link' => null,
                'action_label' => null,
                'visibility_scope' => 'global',
                'audience_roles' => ['guest', 'authenticated', 'student', 'faculty', 'admin'],
                'display_locations' => ['all'],
            ],
            [
                'key' => 'system-maintenance',
                'title' => 'Scheduled System Maintenance',
                'content' => 'The portal will undergo maintenance tonight from 10:00 PM to 12:00 AM. Some features may be temporarily unavailable.',
                'type' => 'maintenance',
                'priority' => 'high',
                'display_mode' => 'toast',
                'link' => null,
                'action_label' => null,
                'visibility_scope' => 'global',
                'audience_roles' => ['authenticated', 'student', 'faculty', 'admin'],
                'display_locations' => ['admin_layout', 'student_layout', 'faculty_layout'],
            ],
            [
                'key' => 'tuition-deadline',
                'title' => 'Tuition Payment Deadline Reminder',
                'content' => 'Please settle your tuition balance on or before the due date to avoid enrollment and exam clearance issues.',
                'type' => 'update',
                'priority' => 'medium',
                'display_mode' => 'banner',
                'link' => '/student/tuition',
                'action_label' => 'View tuition',
                'visibility_scope' => 'role_based',
                'audience_roles' => ['student'],
                'display_locations' => ['student_layout'],
            ],
            [
                'key' => 'faculty-grading',
                'title' => 'Faculty Grading Submission Reminder',
                'content' => 'Please complete and submit grades before the deadline set by the registrar.',
                'type' => 'info',
                'priority' => 'medium',
                'display_mode' => 'banner',
                'link' => '/faculty/classes',
                'action_label' => 'Open classes',
                'visibility_scope' => 'role_based',
                'audience_roles' => ['faculty'],
                'display_locations' => ['faculty_layout'],
            ],
        ];
    }

    private function visibleQuery(): Builder
    {
        return Announcement::query()
            ->global()
            ->published()
            ->active();
    }

    private function applyPortalOrdering(Builder $query): Builder
    {
        if (Announcement::schemaHasCachedColumn('published_at')) {
            $query->orderByDesc('published_at');
        }

        return $query->orderByDesc('created_at');
    }

    private function applyBannerOrdering(Builder $query): Builder
    {
        if (Announcement::schemaHasCachedColumn('priority')) {
            $query->orderByDesc('priority');
        }

        return $this->applyPortalOrdering($query);
    }

    private function matchesAudience(Announcement $announcement, ?User $user): bool
    {
        $scope = (string) ($announcement->visibility_scope ?? 'global');
        $roles = collect($announcement->audience_roles ?? [])
            ->map(fn (mixed $role): string => mb_strtolower((string) $role))
            ->filter()
            ->values();

        if ($scope === 'guest_only') {
            return $user === null;
        }

        if ($scope === 'authenticated_only') {
            return $user !== null;
        }

        if ($scope !== 'role_based') {
            return true;
        }

        if ($roles->isEmpty()) {
            return true;
        }

        $viewerRole = mb_strtolower((string) ($user?->role?->value ?? $user?->role ?? 'guest'));

        if ($user !== null && $roles->contains('authenticated')) {
            return true;
        }

        return $roles->contains($viewerRole) || ($user === null && $roles->contains('guest'));
    }

    private function matchesLocation(Announcement $announcement, string $location): bool
    {
        $locations = collect($announcement->display_locations ?? [])
            ->map(fn (mixed $item): string => mb_strtolower((string) $item))
            ->filter()
            ->values();

        if ($locations->isEmpty()) {
            return true;
        }

        return $locations->contains('all') || $locations->contains(mb_strtolower($location));
    }

    /**
     * @return array{
     *     id: int,
     *     title: string,
     *     content: string,
     *     type: string,
     *     priority: string,
     *     display_mode: string,
     *     requires_acknowledgment: bool,
     *     link: string|null,
     *     action_label: string|null,
     *     is_active: bool,
     *     visibility_scope: string,
     *     audience_roles: array<int, string>,
     *     display_locations: array<int, string>,
     *     starts_at: string|null,
     *     ends_at: string|null,
     *     creator: array{id: int|null, name: string}|null,
     *     created_at: string|null
     * }
     */
    private function mapForAdministration(Announcement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'content' => $announcement->content,
            'type' => $announcement->type,
            'priority' => (string) ($announcement->priority ?? 'medium'),
            'display_mode' => (string) ($announcement->display_mode ?? 'banner'),
            'requires_acknowledgment' => (bool) $announcement->requires_acknowledgment,
            'link' => $announcement->link,
            'action_label' => $announcement->action_label,
            'is_active' => (bool) ($announcement->is_active ?? $announcement->isActive()),
            'visibility_scope' => (string) ($announcement->visibility_scope ?? 'global'),
            'audience_roles' => array_values($announcement->audience_roles ?? []),
            'display_locations' => array_values($announcement->display_locations ?? ['all']),
            'starts_at' => ($announcement->starts_at ?? $announcement->published_at)?->toIso8601String(),
            'ends_at' => ($announcement->ends_at ?? $announcement->expires_at)?->toIso8601String(),
            'creator' => $announcement->creator
                ? [
                    'id' => $announcement->creator->id,
                    'name' => $announcement->creator->name,
                ]
                : null,
            'created_at' => $announcement->created_at?->toIso8601String(),
        ];
    }
}
