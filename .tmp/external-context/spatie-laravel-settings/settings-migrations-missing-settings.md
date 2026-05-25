---
source: Context7 API
library: Laravel Settings
package: spatie/laravel-settings
topic: settings migrations workflow and MissingSettings mitigation
fetched: 2026-05-16T00:00:00Z
official_docs: https://github.com/spatie/laravel-settings#readme
---

## Relevant commands

- Create a settings migration:
  - `php artisan make:settings-migration CreateGeneralSettings`
- Run migrations (includes `database/settings` migrations):
  - `php artisan migrate`
- Optional maintenance commands when class discovery/cache is stale:
  - `php artisan settings:discover`
  - `php artisan settings:clear-discovered`
  - `php artisan settings:clear-cache`

## MissingSettings behavior

- Every settings class property should have a matching settings migration entry, otherwise `MissingSettings` can be thrown.
- Settings properties are resolved in one go; to avoid `MissingSettings` when migrations lag behind, define default values for **every** property on the settings class.

## Settings migration pattern

```php
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('general.site_name', 'Spatie');
        $this->migrator->add('general.site_active', true);
        // Example new property:
        $this->migrator->add('general.auth_layout', 'default');
    }
};
```

## Default values pattern (critical for seeders/startup paths)

```php
use Spatie\LaravelSettings\Settings;

class GeneralSettings extends Settings
{
    public string $site_name = 'Spatie';
    public bool $site_active = true;
    public string $auth_layout = 'default';

    public static function group(): string
    {
        return 'general';
    }
}
```

## Seeder mitigation

- Seeders that touch settings should assume migrations may be slightly out-of-sync in local/CI bootstrap.
- Keep default values on all properties (including newly added ones like `auth_layout`) so resolution cannot fail before migration is applied.
