<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\GeneralSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\LibrarySystem\Actions\StoreDigitalEdition;
use Modules\LibrarySystem\Enums\DigitalEditionStatus;
use Modules\LibrarySystem\Enums\DigitalRightsBasis;
use Modules\LibrarySystem\Models\Author;
use Modules\LibrarySystem\Models\Book;
use Modules\LibrarySystem\Models\Category;
use Modules\LibrarySystem\Models\DigitalEdition;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    config([
        'activitylog.enabled' => false,
        'inertia.testing.ensure_pages_exist' => false,
        'librarysystem.ebooks.disk' => 'library-test',
        'filesystems.disks.library-test' => [
            'driver' => 'local',
            'root' => storage_path('framework/testing/disks/library-test'),
            'throw' => true,
        ],
    ]);
    Storage::fake('library-test');

    GeneralSetting::factory()->create([
        'library_module_enabled' => true,
        'is_setup' => true,
    ]);
});

it('keeps staff uploads as drafts until a separate rights-confirmed publication', function (UserRole $role): void {
    $book = createManagedDigitalLibraryBook();
    $user = User::factory()->create(['role' => $role]);

    actingAs($user)
        ->post(route('administrators.library.books.digital-edition.store', $book), validDigitalEditionPayload())
        ->assertRedirect();

    $edition = $book->digitalEdition()->firstOrFail();

    expect($edition->status)->toBe(DigitalEditionStatus::Draft)
        ->and($edition->downloads_allowed)->toBeFalse()
        ->and($edition->rights_confirmed_by)->toBeNull()
        ->and($edition->sha256)->toBe(hash('sha256', "%PDF-1.4\nDigital edition fixture"));

    Storage::disk('library-test')->assertExists($edition->path);

    actingAs($user)
        ->put(route('administrators.library.books.digital-edition.update', $book), [
            'status' => 'published',
            'downloads_allowed' => false,
            'rights_basis' => 'koakademy_owned',
            'rights_holder' => 'KoAkademy',
            'rights_notes' => 'Institution-owned material.',
            'rights_confirmed' => true,
        ])
        ->assertRedirect();

    expect($edition->refresh()->status)->toBe(DigitalEditionStatus::Published)
        ->and($edition->rights_confirmed_by)->toBe($user->id);
})->with([
    UserRole::Librarian,
    UserRole::Admin,
    UserRole::SuperAdmin,
    UserRole::Developer,
]);

it('forbids other portal administrators from managing digital editions', function (): void {
    $book = createManagedDigitalLibraryBook();
    $cashier = User::factory()->create(['role' => UserRole::Cashier]);

    actingAs($cashier)
        ->post(route('administrators.library.books.digital-edition.store', $book), validDigitalEditionPayload())
        ->assertForbidden();

    expect($book->digitalEdition()->exists())->toBeFalse();
});

it('requires documented rights and attestation before publication', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);

    $payload = validDigitalEditionPayload();
    unset($payload['rights_basis'], $payload['rights_confirmed']);

    actingAs($librarian)
        ->post(route('administrators.library.books.digital-edition.store', $book), $payload)
        ->assertSessionHasErrors(['rights_basis', 'rights_confirmed']);

    expect($book->digitalEdition()->exists())->toBeFalse();
});

it('accepts drafts without rights publication fields', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);

    actingAs($librarian)
        ->post(route('administrators.library.books.digital-edition.store', $book), [
            'pdf' => UploadedFile::fake()->createWithContent('draft.pdf', "%PDF-1.4\nDraft fixture"),
            'status' => 'draft',
            'downloads_allowed' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($book->digitalEdition()->firstOrFail()->status)->toBe(DigitalEditionStatus::Draft);
});

it('rejects files with a fake PDF extension and invalid signature', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);

    actingAs($librarian)
        ->post(route('administrators.library.books.digital-edition.store', $book), [
            'pdf' => UploadedFile::fake()->createWithContent('malicious.pdf', '<?php echo "not a pdf";'),
            'status' => 'draft',
            'downloads_allowed' => false,
        ])
        ->assertSessionHasErrors('pdf');

    expect($book->digitalEdition()->exists())->toBeFalse();
});

it('rejects PDFs larger than the configured upload limit', function (): void {
    config(['librarysystem.ebooks.max_upload_kilobytes' => 1]);
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);

    actingAs($librarian)
        ->post(route('administrators.library.books.digital-edition.store', $book), [
            'pdf' => UploadedFile::fake()->createWithContent('oversized.pdf', '%PDF-'.str_repeat('x', 2048)),
            'status' => 'draft',
            'downloads_allowed' => false,
        ])
        ->assertSessionHasErrors('pdf');

    expect($book->digitalEdition()->exists())->toBeFalse();
});

it('replaces the object only after the new edition is stored', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);
    $oldEdition = createManagedPublishedDigitalEdition($book);
    Storage::disk('library-test')->put($oldEdition->path, "%PDF-1.4\nOld");

    actingAs($librarian)
        ->post(route('administrators.library.books.digital-edition.store', $book), validDigitalEditionPayload('replacement.pdf'))
        ->assertRedirect();

    $replacement = $book->digitalEdition()->firstOrFail();

    expect($replacement->path)->not->toBe($oldEdition->path);
    Storage::disk('library-test')->assertMissing($oldEdition->path);
    Storage::disk('library-test')->assertExists($replacement->path);
});

it('updates publication controls without exposing private storage metadata', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);
    $edition = createManagedPublishedDigitalEdition($book);

    actingAs($librarian)
        ->put(route('administrators.library.books.digital-edition.update', $book), [
            'status' => 'published',
            'downloads_allowed' => true,
            'rights_basis' => 'written_permission',
            'rights_holder' => 'Test Author',
            'rights_notes' => 'Written authorization is on file.',
            'rights_confirmed' => true,
        ])
        ->assertRedirect();

    expect($edition->refresh()->downloads_allowed)->toBeTrue()
        ->and($edition->rights_holder)->toBe('Test Author');

    actingAs($librarian)
        ->get(route('administrators.library.books.edit', $book))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('book.digital_edition.original_name', 'fixture.pdf')
            ->where('book.digital_edition.downloads_allowed', true)
            ->missing('book.digital_edition.path')
            ->missing('book.digital_edition.disk')
            ->missing('book.digital_edition.sha256'));
});

it('removes the explicit digital edition but retains it when the book is soft deleted', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);
    $edition = createManagedPublishedDigitalEdition($book);
    Storage::disk('library-test')->put($edition->path, "%PDF-1.4\nRetained");

    $book->delete();
    Storage::disk('library-test')->assertExists($edition->path);
    expect(DigitalEdition::query()->whereKey($edition->id)->exists())->toBeTrue();

    $book->restore();

    actingAs($librarian)
        ->delete(route('administrators.library.books.digital-edition.destroy', $book))
        ->assertRedirect();

    expect(DigitalEdition::query()->whereKey($edition->id)->exists())->toBeFalse();
    Storage::disk('library-test')->assertMissing($edition->path);
});

it('preserves the previous edition and removes the new object when the database update fails', function (): void {
    $book = createManagedDigitalLibraryBook();
    $librarian = User::factory()->create(['role' => UserRole::Librarian]);
    $edition = createManagedPublishedDigitalEdition($book);
    $originalPath = $edition->path;
    Storage::disk('library-test')->put($originalPath, "%PDF-1.4\nPrevious edition");

    DigitalEdition::saving(function (DigitalEdition $savingEdition) use ($originalPath): void {
        if ($savingEdition->path !== $originalPath) {
            throw new RuntimeException('Simulated database failure.');
        }
    });

    try {
        app(StoreDigitalEdition::class)->execute(
            $book,
            UploadedFile::fake()->createWithContent('replacement.pdf', "%PDF-1.4\nReplacement"),
            [
                'status' => 'published',
                'downloads_allowed' => false,
                'rights_basis' => 'koakademy_owned',
            ],
            $librarian
        );
    } catch (RuntimeException $exception) {
        expect($exception->getMessage())->toBe('Simulated database failure.');
    } finally {
        DigitalEdition::flushEventListeners();
    }

    expect($edition->refresh()->path)->toBe($originalPath)
        ->and(Storage::disk('library-test')->allFiles("books/{$book->id}"))->toBe([$originalPath]);
});

function validDigitalEditionPayload(string $filename = 'book.pdf'): array
{
    return [
        'pdf' => UploadedFile::fake()->createWithContent($filename, "%PDF-1.4\nDigital edition fixture"),
        'status' => 'published',
        'downloads_allowed' => false,
        'rights_basis' => 'koakademy_owned',
        'rights_holder' => 'KoAkademy',
        'rights_notes' => 'Institution-owned material.',
        'rights_confirmed' => true,
    ];
}

function createManagedDigitalLibraryBook(array $attributes = []): Book
{
    $author = Author::query()->create([
        'name' => 'Managed Author '.fake()->unique()->numerify('###'),
    ]);
    $category = Category::query()->create([
        'name' => 'Managed Category '.fake()->unique()->numerify('###'),
        'color' => '#B45309',
    ]);

    return Book::query()->create(array_merge([
        'title' => 'Managed Library Book '.fake()->unique()->numerify('####'),
        'author_id' => $author->id,
        'category_id' => $category->id,
        'description' => 'A catalog description for digital-edition management testing.',
        'total_copies' => 1,
        'available_copies' => 1,
        'status' => 'available',
    ], $attributes));
}

function createManagedPublishedDigitalEdition(Book $book): DigitalEdition
{
    return DigitalEdition::query()->create([
        'book_id' => $book->id,
        'disk' => 'library-test',
        'path' => "books/{$book->id}/fixture.pdf",
        'original_name' => 'fixture.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 32,
        'sha256' => str_repeat('a', 64),
        'status' => DigitalEditionStatus::Published,
        'downloads_allowed' => false,
        'rights_basis' => DigitalRightsBasis::KoakademyOwned,
        'rights_holder' => 'KoAkademy',
        'uploaded_at' => now(),
        'published_at' => now(),
        'rights_confirmed_at' => now(),
    ]);
}
