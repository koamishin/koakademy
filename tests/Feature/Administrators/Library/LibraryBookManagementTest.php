<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Modules\LibrarySystem\Models\Author;
use Modules\LibrarySystem\Models\Book;
use Modules\LibrarySystem\Models\Category;

use function Pest\Laravel\actingAs;

it('stores a book with its library identifiers', function (): void {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    $author = Author::query()->create([
        'name' => 'Test Library Author',
    ]);

    $category = Category::query()->create([
        'name' => 'Test Library Category',
    ]);

    actingAs($admin)
        ->post(route('administrators.library.books.store'), [
            'title' => 'Catalog Regression Test',
            'isbn' => '978-1-4028-9462-6',
            'call_number' => 'QA76.73.P224',
            'accession_number' => 'ACC-2026-0001',
            'author_id' => $author->id,
            'category_id' => $category->id,
            'publisher' => 'KoAcademy Press',
            'publication_year' => 2026,
            'pages' => 320,
            'description' => 'Verifies the administrator add-book request.',
            'total_copies' => 3,
            'available_copies' => 5,
            'location' => 'Main Library A-12',
            'status' => 'available',
        ])
        ->assertRedirect(route('administrators.library.books.index'));

    $book = Book::query()
        ->where('accession_number', 'ACC-2026-0001')
        ->first();

    expect($book)->not->toBeNull()
        ->and($book?->title)->toBe('Catalog Regression Test')
        ->and($book?->call_number)->toBe('QA76.73.P224')
        ->and($book?->accession_number)->toBe('ACC-2026-0001')
        ->and($book?->author_id)->toBe($author->id)
        ->and($book?->category_id)->toBe($category->id)
        ->and($book?->total_copies)->toBe(3)
        ->and($book?->available_copies)->toBe(3);
});

it('stores multiple books with the same ISBN', function (): void {
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
    ]);

    $author = Author::query()->create([
        'name' => 'Duplicate ISBN Author',
    ]);

    $category = Category::query()->create([
        'name' => 'Duplicate ISBN Category',
    ]);

    $isbn = '978-1-4028-9462-6';
    $payload = [
        'isbn' => $isbn,
        'author_id' => $author->id,
        'category_id' => $category->id,
        'publisher' => 'KoAcademy Press',
        'publication_year' => 2026,
        'pages' => 320,
        'total_copies' => 1,
        'available_copies' => 1,
        'location' => 'Main Library A-12',
        'status' => 'available',
    ];

    actingAs($admin)
        ->post(route('administrators.library.books.store'), [
            ...$payload,
            'title' => 'First Catalog Record',
            'accession_number' => 'ACC-2026-0002',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('administrators.library.books.index'));

    actingAs($admin)
        ->post(route('administrators.library.books.store'), [
            ...$payload,
            'title' => 'Second Catalog Record',
            'accession_number' => 'ACC-2026-0003',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('administrators.library.books.index'));

    expect(Book::query()->where('isbn', $isbn)->count())->toBe(2);
});
