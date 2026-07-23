<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\LibrarySystem\Http\Requests\DigitalLibraryCatalogRequest;
use Modules\LibrarySystem\Models\Book;
use Modules\LibrarySystem\Models\Category;
use Modules\LibrarySystem\Models\DigitalEdition;
use Modules\LibrarySystem\Models\UserBookState;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Throwable;

final class DigitalLibraryController extends Controller
{
    public function index(DigitalLibraryCatalogRequest $request): Response
    {
        $validated = $request->validated();
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $search = mb_trim((string) ($validated['search'] ?? ''));
        $availability = (string) ($validated['availability'] ?? 'all');
        $collection = (string) ($validated['collection'] ?? 'all');
        $sort = (string) ($validated['sort'] ?? 'title');

        $query = Book::query()
            ->select([
                'id',
                'title',
                'isbn',
                'call_number',
                'author_id',
                'category_id',
                'publisher',
                'publication_year',
                'description',
                'cover_image',
                'cover_image_path',
                'created_at',
            ])
            ->with([
                'author:id,name',
                'category:id,name,color',
                'digitalEdition' => fn ($query) => $query
                    ->accessible()
                    ->select(['id', 'book_id', 'downloads_allowed', 'rights_expires_at']),
            ])
            ->withExists([
                'userStates as is_favorite' => fn (Builder $query) => $query
                    ->where('user_id', $user->id)
                    ->whereNotNull('favorited_at'),
            ])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->whereLike('title', "%{$search}%")
                        ->orWhereLike('isbn', "%{$search}%")
                        ->orWhereLike('call_number', "%{$search}%")
                        ->orWhereHas('author', fn (Builder $query) => $query->whereLike('name', "%{$search}%"))
                        ->orWhereHas('category', fn (Builder $query) => $query->whereLike('name', "%{$search}%"));
                });
            })
            ->when(
                isset($validated['category_id']),
                fn (Builder $query) => $query->where('category_id', $validated['category_id'])
            )
            ->when(
                isset($validated['year']),
                fn (Builder $query) => $query->where('publication_year', $validated['year'])
            )
            ->when(
                $availability === 'online',
                fn (Builder $query) => $query->whereHas('digitalEdition', fn (Builder $query) => $query->accessible())
            )
            ->when(
                $availability === 'catalog',
                fn (Builder $query) => $query->whereDoesntHave('digitalEdition', fn (Builder $query) => $query->accessible())
            )
            ->when(
                $collection === 'favorites',
                fn (Builder $query) => $query->whereHas('userStates', fn (Builder $query) => $query
                    ->where('user_id', $user->id)
                    ->whereNotNull('favorited_at'))
            )
            ->when(
                $collection === 'recent',
                fn (Builder $query) => $query->whereHas('userStates', fn (Builder $query) => $query
                    ->where('user_id', $user->id)
                    ->whereNotNull('last_read_at'))
            );

        $this->applySort($query, $sort, $collection, $user);

        $books = $query
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Book $book): array => $this->bookCardData($book));

        return Inertia::render('library/index', [
            'books' => $books,
            'filters' => [
                'search' => $search,
                'category_id' => $validated['category_id'] ?? null,
                'year' => $validated['year'] ?? null,
                'availability' => $availability,
                'collection' => $collection,
                'sort' => $sort,
            ],
            'options' => [
                'categories' => Category::query()
                    ->select(['id', 'name'])
                    ->orderBy('name')
                    ->get(),
                'years' => Book::query()
                    ->whereNotNull('publication_year')
                    ->distinct()
                    ->orderByDesc('publication_year')
                    ->pluck('publication_year'),
            ],
            'stats' => [
                'catalog_books' => Book::query()->count(),
                'available_online' => DigitalEdition::query()->accessible()->whereHas('book')->count(),
                'favorites' => UserBookState::query()
                    ->where('user_id', $user->id)
                    ->whereNotNull('favorited_at')
                    ->whereHas('book')
                    ->count(),
            ],
        ]);
    }

    public function show(Book $book): Response
    {
        $authenticatedUser = request()->user();
        abort_unless($authenticatedUser instanceof User, 401);

        $book->load([
            'author:id,name,biography',
            'category:id,name,color,description',
            'digitalEdition' => fn ($query) => $query
                ->accessible()
                ->select(['id', 'book_id', 'downloads_allowed', 'rights_basis', 'rights_holder', 'license_url', 'rights_expires_at']),
        ]);

        $state = UserBookState::query()
            ->where('user_id', $authenticatedUser->id)
            ->where('book_id', $book->id)
            ->first();

        $related = Book::query()
            ->select(['id', 'title', 'author_id', 'category_id', 'publication_year', 'cover_image', 'cover_image_path'])
            ->where('category_id', $book->category_id)
            ->whereKeyNot($book->id)
            ->with([
                'author:id,name',
                'digitalEdition' => fn ($query) => $query
                    ->accessible()
                    ->select(['id', 'book_id']),
            ])
            ->orderBy('title')
            ->orderBy('id')
            ->limit(4)
            ->get()
            ->map(fn (Book $relatedBook): array => $this->bookCardData($relatedBook));

        return Inertia::render('library/show', [
            'book' => $this->bookDetailData($book),
            'state' => [
                'is_favorite' => $state?->favorited_at !== null,
                'last_page' => $state?->last_page,
                'total_pages' => $state?->total_pages,
                'last_read_at' => $state?->last_read_at?->toIso8601String(),
            ],
            'related' => $related,
            'takedown_email' => config('librarysystem.ebooks.takedown_email'),
        ]);
    }

    public function read(Book $book): Response
    {
        $user = request()->user();
        abort_unless($user instanceof User, 401);

        $book->load(['author:id,name', 'digitalEdition' => fn ($query) => $query->accessible()]);
        $edition = $book->digitalEdition;

        abort_unless($edition instanceof DigitalEdition, 404);
        $this->abortUnlessObjectExists($edition);

        $state = UserBookState::query()->firstOrCreate([
            'user_id' => $user->id,
            'book_id' => $book->id,
        ]);
        $state->forceFill(['last_read_at' => now()])->save();

        $bookmarks = $book->bookmarks()
            ->where('user_id', $user->id)
            ->orderBy('page')
            ->get(['id', 'page', 'label']);

        return Inertia::render('library/read', [
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author?->name,
                'downloads_allowed' => $edition->downloads_allowed,
            ],
            'reader' => [
                'content_url' => route('library.books.content', $book),
                'download_url' => $edition->downloads_allowed
                    ? route('library.books.download', $book)
                    : null,
                'last_page' => $state->last_page ?? 1,
                'total_pages' => $state->total_pages,
                'bookmarks' => $bookmarks,
            ],
        ]);
    }

    public function content(Book $book): HttpResponse
    {
        $edition = $this->accessibleEdition($book);
        $this->abortUnlessObjectExists($edition);

        return $this->fileResponse($book, $edition, false);
    }

    public function download(Book $book): HttpResponse
    {
        $edition = $this->accessibleEdition($book);
        abort_unless($edition->downloads_allowed, 403, 'Downloads are not permitted for this title.');
        $this->abortUnlessObjectExists($edition);

        activity('library')
            ->causedBy(request()->user())
            ->performedOn($book)
            ->withProperties(['digital_edition_id' => $edition->id])
            ->log('Downloaded a digital edition');

        return $this->fileResponse($book, $edition, true);
    }

    private function accessibleEdition(Book $book): DigitalEdition
    {
        $edition = $book->digitalEdition()->accessible()->first();
        abort_unless($edition instanceof DigitalEdition, 404);

        return $edition;
    }

    private function abortUnlessObjectExists(DigitalEdition $edition): void
    {
        try {
            $exists = Storage::disk($edition->disk)->exists($edition->path);
        } catch (Throwable $throwable) {
            report($throwable);
            abort(503, 'The digital edition is temporarily unavailable.');
        }

        abort_unless($exists, 404);
    }

    private function fileResponse(Book $book, DigitalEdition $edition, bool $download): HttpResponse
    {
        $filename = (Str::slug($book->title) ?: 'book').'.pdf';
        $driver = config("filesystems.disks.{$edition->disk}.driver");

        try {
            if ($driver === 's3') {
                $minutes = (int) config(
                    $download ? 'librarysystem.ebooks.download_url_minutes' : 'librarysystem.ebooks.reader_url_minutes',
                    $download ? 5 : 60
                );
                $expiresAt = now()->addMinutes($minutes);

                if ($edition->rights_expires_at?->isBefore($expiresAt)) {
                    $expiresAt = $edition->rights_expires_at;
                }

                $disposition = $download ? 'attachment' : 'inline';
                $url = Storage::disk($edition->disk)->temporaryUrl(
                    $edition->path,
                    $expiresAt,
                    [
                        'ResponseContentType' => 'application/pdf',
                        'ResponseContentDisposition' => sprintf('%s; filename="%s"', $disposition, $filename),
                        'ResponseCacheControl' => 'private, no-store',
                    ]
                );

                return redirect()->away($url);
            }

            if ($download) {
                return Storage::disk($edition->disk)->download($edition->path, $filename, [
                    'Content-Type' => 'application/pdf',
                    'Cache-Control' => 'private, no-store',
                    'X-Content-Type-Options' => 'nosniff',
                ]);
            }

            return Storage::disk($edition->disk)->response(
                $edition->path,
                $filename,
                [
                    'Content-Type' => 'application/pdf',
                    'Cache-Control' => 'private, no-store',
                    'X-Content-Type-Options' => 'nosniff',
                ],
                'inline'
            );
        } catch (Throwable $throwable) {
            report($throwable);
            abort(503, 'The digital edition is temporarily unavailable.');
        }
    }

    private function applySort(Builder $query, string $sort, string $collection, User $user): void
    {
        if ($collection === 'recent') {
            $query->orderByDesc(
                UserBookState::query()
                    ->select('last_read_at')
                    ->whereColumn('book_id', 'library_books.id')
                    ->where('user_id', $user->id)
                    ->limit(1)
            )->orderBy('id');

            return;
        }

        match ($sort) {
            'year_newest' => $query->orderByDesc('publication_year')->orderBy('title')->orderBy('id'),
            'year_oldest' => $query->orderBy('publication_year')->orderBy('title')->orderBy('id'),
            'recently_added' => $query->orderByDesc('created_at')->orderByDesc('id'),
            default => $query->orderBy('title')->orderBy('id'),
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function bookCardData(Book $book): array
    {
        return [
            'id' => $book->id,
            'title' => $book->title,
            'author' => $book->author?->name,
            'category' => $book->category?->name,
            'category_color' => $book->category?->color,
            'publication_year' => $book->publication_year,
            'description' => Str::limit(strip_tags((string) $book->description), 150),
            'cover_image_url' => $this->coverImageUrl($book),
            'available_online' => $book->digitalEdition instanceof DigitalEdition,
            'is_favorite' => (bool) ($book->is_favorite ?? false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function bookDetailData(Book $book): array
    {
        $edition = $book->digitalEdition;

        return [
            'id' => $book->id,
            'title' => $book->title,
            'isbn' => $book->isbn,
            'call_number' => $book->call_number,
            'accession_number' => $book->accession_number,
            'author' => $book->author?->name,
            'author_biography' => $book->author?->biography,
            'category' => $book->category?->name,
            'category_color' => $book->category?->color,
            'publisher' => $book->publisher,
            'publication_year' => $book->publication_year,
            'pages' => $book->pages,
            'description' => $book->description,
            'location' => $book->location,
            'cover_image_url' => $this->coverImageUrl($book),
            'available_online' => $edition instanceof DigitalEdition,
            'downloads_allowed' => $edition?->downloads_allowed ?? false,
            'rights_basis' => $edition?->rights_basis?->value,
            'rights_holder' => $edition?->rights_holder,
            'license_url' => $edition?->license_url,
            'rights_expires_at' => $edition?->rights_expires_at?->toIso8601String(),
        ];
    }

    private function coverImageUrl(Book $book): ?string
    {
        if (filled($book->cover_image_path)) {
            return Storage::disk('public')->url((string) $book->cover_image_path);
        }

        if (! filled($book->cover_image)) {
            return null;
        }

        $url = filter_var($book->cover_image, FILTER_VALIDATE_URL);
        $scheme = is_string($url) ? parse_url($url, PHP_URL_SCHEME) : null;

        return is_string($url) && in_array($scheme, ['http', 'https'], true) ? $url : null;
    }
}
