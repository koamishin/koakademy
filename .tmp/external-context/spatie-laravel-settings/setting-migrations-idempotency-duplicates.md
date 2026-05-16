---
source: Context7 API + official source
library: Laravel Settings
package: spatie/laravel-settings
topic: setting migrations add idempotency duplicate creation and remediation commands
fetched: 2026-05-16T00:00:00Z
official_docs: https://github.com/spatie/laravel-settings#creating-settings-migrations
---

## `add` behavior and idempotency

- `SettingsMigrator::add('group.key', $value)` is **not idempotent** by itself.
- Internally, `add` checks existence first and throws `SettingAlreadyExists::whenAdding($property)` if the key already exists.
- Safe idempotent migration pattern:

```php
public function up(): void
{
    if (! $this->migrator->exists('general.timezone')) {
        $this->migrator->add('general.timezone', 'Europe/Brussels');
    }
}
```

## Duplicate setting creation (`SettingAlreadyExists`)

- Exception message: `Could not create setting {property} because it already exists`.
- Triggered when `add` is executed for an existing key (or `rename` targets an existing destination key).
- Prefer **preventive existence checks** over try/catch in migrations.

## Safe patterns when seeders and settings migrations may touch same key

1. **Schema/structure belongs in settings migrations** (`database/settings`).
2. **Runtime value changes belong in seeders/services** (mutating existing keys only).
3. In seeders, guard with settings defaults and avoid first-time key creation races.
4. In settings classes, provide defaults for all properties to reduce boot-time failures before migrations run.

Practical split:

- Migration: create key once (guarded with `exists`).
- Seeder: update value only if business logic requires it.

## Recommended remediation / verification commands

```bash
# generate a settings migration
php artisan make:settings-migration CreateGeneralSettings

# apply pending DB + settings migrations
php artisan migrate

# clear package caches if discovery or stale values are suspected
php artisan settings:clear-discovered
php artisan settings:discover
php artisan settings:clear-cache
```

For Laravel Sail projects, run the same commands via `vendor/bin/sail artisan ...`.
