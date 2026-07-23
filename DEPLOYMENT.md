# Deployment

This is the canonical production and upgrade runbook for KoAkademy.

## Supported architecture

`compose.production.yaml` runs four private services: the application, PostgreSQL, Redis, and Gotenberg. Only the application is published, and only to `127.0.0.1:8000`. Uploads use external S3-compatible storage. An operator-managed Caddy, Nginx, Traefik, or tunnel terminates HTTPS and proxies to the loopback origin.

The default is one hostname:

```text
https://school.example/        portal
https://school.example/admin   administration
```

Split portal and admin subdomains are an advanced configuration. Add both hostnames to `PORTAL_HOST`, `ADMIN_HOST`, and the proxy certificate/routing configuration.

## First deployment

Follow [Getting Started](GETTING_STARTED.md). The required order is:

1. Copy and secure `.env`.
2. Validate Compose configuration.
3. Start PostgreSQL, Redis, and Gotenberg.
4. Generate `APP_KEY`.
5. Run `php artisan migrate --force` explicitly.
6. Start the application.
7. Verify the loopback `/up` endpoint.
8. Configure HTTPS forwarding.
9. Complete `/setup` and reach `/admin`.

Container startup never needs migration privileges beyond the application's normal database user, and `RUN_MIGRATIONS=false` is the supported production setting.

## Reverse proxy requirements

Terminate TLS at the edge and forward to `http://127.0.0.1:8000`. Preserve these headers:

```text
Host
X-Forwarded-For
X-Forwarded-Host
X-Forwarded-Proto
```

`TRUSTED_HOSTS` accepts additional comma-separated exact hostnames. `TRUSTED_PROXIES` accepts `*`, IP addresses, or CIDRs. Trusting all proxies is appropriate only while the application port remains loopback-only; use explicit edge proxy addresses if the origin becomes reachable from another network.

Example Caddy site:

```text
school.example {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8000
}
```

## Backups

Back up both data planes:

- PostgreSQL database, including a periodic restore test
- S3-compatible bucket, according to the provider's versioning and retention controls

The Redis volume is operational state, not the source of record. Preserve `.env` and `APP_KEY` in an encrypted secret store; losing `APP_KEY` can make encrypted application data and sessions unreadable.

Example database backup:

```sh
docker compose --env-file .env -f compose.production.yaml exec -T postgres \
  pg_dump --clean --if-exists --no-owner --username="$DB_USERNAME" "$DB_DATABASE" > koakademy.sql
```

Run this from a shell where the variables were loaded safely, or substitute the configured non-secret database name and user. Protect the resulting dump as sensitive institutional data.

## Upgrade

KoAkademy supports upgrades to the latest stable release. Read [CHANGELOG.md](CHANGELOG.md) and the GitHub release notes first.

```sh
# 1. Back up PostgreSQL and verify object-storage protection.
# 2. Update the checked-out stable tag and KOAKADEMY_VERSION in .env.
docker compose --env-file .env -f compose.production.yaml pull app

# 3. Run migrations as a deliberate one-off operation.
docker compose --env-file .env -f compose.production.yaml run --rm app php artisan migrate --force

# 4. Replace the running application and verify it.
docker compose --env-file .env -f compose.production.yaml up -d app
curl --fail --silent --show-error http://127.0.0.1:8000/up
```

Test the portal, `/admin`, authentication, uploads, a queued job, and a PDF export after every upgrade.

When an upgrade includes the Digital Library migrations, run the migration command once as the release job before replacing the application replicas. Never let both Swarm replicas run migrations during startup. After the private bucket and its exact-origin CORS policy are configured, smoke-test through the public DCCP origin:

1. Confirm a catalog-only title is visible but cannot open the reader.
2. Upload a small licensed test PDF as a draft and confirm it is unavailable to normal users.
3. Publish it with a rights basis and confirm inline reading, page navigation, bookmarks, and saved progress.
4. Verify downloads return `403` while disabled, then enable and verify the attachment response.
5. Repeat reader and download requests while routing through each application replica.
6. Unpublish or remove the edition and confirm the previous signed URL expires and no new URL is issued.

## Rollback

Application-image rollback is safe only when the previous code supports the migrated database schema. If release notes do not explicitly allow a code-only rollback, restore the pre-upgrade database backup and matching image together in a maintenance window. Never run `migrate:rollback` blindly on production data.

## Production checklist

- `APP_ENV=production` and `APP_DEBUG=false`
- Unique `APP_KEY`, database password, Redis password, and S3 credentials
- `SESSION_SECURE_COOKIE=true`, HTTPS active, and correct trusted hosts/proxies
- Application published only on `127.0.0.1:8000`
- PostgreSQL, Redis, and Gotenberg have no host port mappings
- `RUN_MIGRATIONS=false`
- `/up`, `/setup` or `/admin`, upload, queue, mail, and PDF smoke tests pass
- Private Digital Library bucket has no public domain, exact-origin CORS supports PDF range requests, and the takedown address is monitored
- Librarian and legal approval exists before publishing production digital editions
- Database and object-storage recovery tested
- Logs, disk use, queue depth, certificate expiry, and backup failures monitored
