<?php

declare(strict_types=1);

namespace Modules\LibrarySystem\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Modules\LibrarySystem\Http\Requests\StoreLibraryBookmarkRequest;
use Modules\LibrarySystem\Http\Requests\UpdateReadingProgressRequest;
use Modules\LibrarySystem\Models\Book;
use Modules\LibrarySystem\Models\LibraryBookmark;
use Modules\LibrarySystem\Models\UserBookState;

final class DigitalLibraryStateController extends Controller
{
    public function favorite(Book $book): RedirectResponse
    {
        $user = $this->authenticatedUser();

        UserBookState::query()->updateOrCreate(
            ['user_id' => $user->id, 'book_id' => $book->id],
            ['favorited_at' => now()]
        );

        return back();
    }

    public function unfavorite(Book $book): RedirectResponse
    {
        $user = $this->authenticatedUser();

        UserBookState::query()
            ->where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->update(['favorited_at' => null]);

        return back();
    }

    public function progress(UpdateReadingProgressRequest $request, Book $book): JsonResponse
    {
        $user = $this->authenticatedUser();
        abort_unless($book->digitalEdition()->accessible()->exists(), 404);
        $validated = $request->validated();

        $state = UserBookState::query()->updateOrCreate(
            ['user_id' => $user->id, 'book_id' => $book->id],
            [
                'last_page' => $validated['last_page'],
                'total_pages' => $validated['total_pages'],
                'last_read_at' => now(),
            ]
        );

        return response()->json([
            'last_page' => $state->last_page,
            'total_pages' => $state->total_pages,
        ]);
    }

    public function bookmark(StoreLibraryBookmarkRequest $request, Book $book): JsonResponse
    {
        $user = $this->authenticatedUser();
        abort_unless($book->digitalEdition()->accessible()->exists(), 404);
        $validated = $request->validated();

        $bookmark = LibraryBookmark::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'book_id' => $book->id,
                'page' => $validated['page'],
            ],
            ['label' => $validated['label'] ?? null]
        );

        return response()->json([
            'id' => $bookmark->id,
            'page' => $bookmark->page,
            'label' => $bookmark->label,
        ]);
    }

    public function removeBookmark(Book $book, LibraryBookmark $bookmark): JsonResponse
    {
        $user = $this->authenticatedUser();

        abort_unless(
            $bookmark->user_id === $user->id && $bookmark->book_id === $book->id,
            404
        );

        $bookmark->delete();

        return response()->json(status: 204);
    }

    private function authenticatedUser(): User
    {
        $user = request()->user();
        abort_unless($user instanceof User, 401);

        return $user;
    }
}
