<?php

declare(strict_types=1);

namespace Modules\Announcement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Announcement\Models\Announcement;
use Modules\Announcement\Services\AnnouncementDataService;

final class AnnouncementController extends Controller
{
    public function __construct(
        private readonly AnnouncementDataService $announcementDataService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Announcement::class);

        return Inertia::render('Announcement/Index', [
            'announcements' => $this->announcementDataService->paginateForAdministration(),
            'templates' => $this->announcementDataService->getTemplates(),
            'options' => [
                'visibilityScopes' => [
                    'global' => 'Global',
                    'authenticated_only' => 'Authenticated users only',
                    'guest_only' => 'Guests only',
                    'role_based' => 'Specific roles',
                ],
                'audienceRoles' => Announcement::ROLE_OPTIONS,
                'displayLocations' => Announcement::LOCATION_OPTIONS,
            ],
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Announcement::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,warning,danger,success,maintenance,enrollment,update',
            'priority' => 'nullable|string|in:urgent,high,medium,low',
            'display_mode' => 'nullable|string|in:banner,toast,modal',
            'requires_acknowledgment' => 'boolean',
            'link' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/'],
            'action_label' => 'nullable|string|max:80',
            'is_active' => 'boolean',
            'visibility_scope' => 'nullable|string|in:global,authenticated_only,guest_only,role_based',
            'audience_roles' => 'nullable|array',
            'audience_roles.*' => 'string|in:guest,authenticated,admin,student,faculty',
            'display_locations' => 'nullable|array',
            'display_locations.*' => 'string|in:all,login,signup,enrollment,home,admin_layout,student_layout,faculty_layout',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        Announcement::query()->create($this->normalizePayload(
            validated: $validated,
            authorId: (int) $request->user()->id,
        ));

        return redirect()->back()->with('success', 'Announcement created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $this->authorize('update', $announcement);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,warning,danger,success,maintenance,enrollment,update',
            'priority' => 'nullable|string|in:urgent,high,medium,low',
            'display_mode' => 'nullable|string|in:banner,toast,modal',
            'requires_acknowledgment' => 'boolean',
            'link' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/'],
            'action_label' => 'nullable|string|max:80',
            'is_active' => 'boolean',
            'visibility_scope' => 'nullable|string|in:global,authenticated_only,guest_only,role_based',
            'audience_roles' => 'nullable|array',
            'audience_roles.*' => 'string|in:guest,authenticated,admin,student,faculty',
            'display_locations' => 'nullable|array',
            'display_locations.*' => 'string|in:all,login,signup,enrollment,home,admin_layout,student_layout,faculty_layout',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
        ]);

        $announcement->update($this->normalizePayload(
            validated: $validated,
            authorId: (int) ($announcement->created_by ?? $request->user()->id),
        ));

        return redirect()->back()->with('success', 'Announcement updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Announcement $announcement): RedirectResponse
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        return redirect()->back()->with('success', 'Announcement deleted successfully.');
    }

    /**
     * @param  array{
     *     title: string,
     *     content: string,
     *     type: string,
     *     priority?: string,
     *     display_mode?: string,
     *     requires_acknowledgment?: bool,
     *     link?: string|null,
     *     action_label?: string|null,
     *     is_active?: bool,
     *     visibility_scope?: string,
     *     audience_roles?: array<int, string>|null,
     *     display_locations?: array<int, string>|null,
     *     starts_at?: string|null,
     *     ends_at?: string|null
     * }  $validated
     * @return array<string, mixed>
     */
    private function normalizePayload(array $validated, int $authorId): array
    {
        $startsAt = $validated['starts_at'] ?? null;
        $endsAt = $validated['ends_at'] ?? null;
        $isActive = (bool) ($validated['is_active'] ?? false);

        return [
            ...$validated,
            'slug' => Str::slug($validated['title']),
            'priority' => $validated['priority'] ?? 'medium',
            'display_mode' => $validated['display_mode'] ?? 'banner',
            'requires_acknowledgment' => $validated['requires_acknowledgment'] ?? false,
            'action_label' => isset($validated['action_label']) && mb_trim($validated['action_label']) !== ''
                ? mb_trim($validated['action_label'])
                : null,
            'visibility_scope' => $validated['visibility_scope'] ?? 'global',
            'audience_roles' => $validated['audience_roles'] ?? null,
            'display_locations' => $validated['display_locations'] ?? ['all'],
            'created_by' => $authorId,
            'is_global' => true,
            'status' => $isActive ? 'published' : 'draft',
            'published_at' => $isActive ? ($startsAt ?: now()) : null,
            'expires_at' => $endsAt,
        ];
    }
}
