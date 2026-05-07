@php
    $items = collect($announcements ?? [])->take(3);
@endphp

@if ($items->isNotEmpty())
    <div class="mb-4 space-y-2">
        @foreach ($items as $announcement)
            <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                <div class="font-semibold">{{ $announcement['title'] ?? 'Announcement' }}</div>
                <div class="mt-1">{{ $announcement['content'] ?? '' }}</div>
                @if (!empty($announcement['link']))
                    <a href="{{ $announcement['link'] }}" class="mt-2 inline-block underline" target="_blank" rel="noopener noreferrer">View details</a>
                @endif
            </div>
        @endforeach
    </div>
@endif
