# Configuration

Start from `.env.production.example`; it is the public production contract for `compose.production.yaml`. Keep `.env` out of version control and restart the application after changes.

## Application and routing

| Variable | Required | Production guidance |
| --- | --- | --- |
| `KOAKADEMY_VERSION` | Yes | Pin the latest stable, non-prerelease image tag. |
| `APP_KEY` | Yes | Generate once per installation and store as a secret. |
| `APP_ENV` | Yes | Must be `production`. |
| `APP_DEBUG` | Yes | Must be `false`; debug output can disclose secrets. |
| `APP_URL` | Yes | Public HTTPS origin, without a trailing path. |
| `PORTAL_HOST` | Yes | Hostname only. Normally the host from `APP_URL`. |
| `ADMIN_HOST` | Yes | Same hostname for the supported `/admin` topology. |
| `TRUSTED_HOSTS` | No | Comma-separated additional exact hostnames; not regex. |
| `TRUSTED_PROXIES` | Yes | `*`, addresses, or CIDRs for the HTTPS edge. See the warning below. |

Host-header validation derives exact patterns from `APP_URL`, `PORTAL_HOST`, `ADMIN_HOST`, and `TRUSTED_HOSTS`. Invalid entries are ignored. `localhost` and `127.0.0.1` remain accepted for local health and maintenance operations.

`TRUSTED_PROXIES=*` is safe in the supplied Compose topology because the origin binds only to loopback. If the application is reachable from another host or network, replace it with explicit proxy IPs/CIDRs so clients cannot forge forwarded headers.

## PostgreSQL

`DB_CONNECTION=pgsql` is required by the prebuilt image. Set `DB_HOST=postgres`, `DB_PORT=5432`, a dedicated database and user, and a random `DB_PASSWORD`. Do not publish the database service port. Use a separately managed PostgreSQL service only after matching backup, TLS, availability, and connection-limit requirements.

## Redis

The production template uses Redis for cache, sessions, and queues. Keep `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, and `QUEUE_CONNECTION=redis`. Set a random `REDIS_PASSWORD`; the Compose service requires it and is not host-published.

## Sessions

Production defaults encrypt server-side session data and mark cookies Secure, HttpOnly, and SameSite=Lax. Leave `SESSION_DOMAIN` empty for a host-only cookie in the one-host topology. Split subdomains may require an explicit shared cookie domain and a security review.

## Object storage

Production uploads require `FILESYSTEM_DISK=s3` and all of:

```dotenv
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_ENDPOINT=
AWS_URL=
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Use a bucket dedicated to this installation and credentials limited to that bucket. `AWS_ENDPOINT` is the provider API endpoint. `AWS_URL` is the public or CDN base URL if objects are served publicly; leave it empty when the provider and application generate URLs without an override. Path-style behavior depends on the provider.

Local storage is retained only for framework runtime files, logs, caches, and temporary work. It is not the supported production upload store.

## PDF rendering

KoAkademy uses `spatie/laravel-pdf` with the Gotenberg driver:

```dotenv
LARAVEL_PDF_DRIVER=gotenberg
LARAVEL_PDF_PRODUCTION_DRIVER=gotenberg
LARAVEL_PDF_PRODUCTION_FALLBACK=
LARAVEL_PDF_ROLLBACK_DRIVER=gotenberg
GOTENBERG_URL=http://gotenberg:3000
```

Gotenberg remains on the private Compose network. DOMPDF is not installed or supported as a fallback. Treat PDF jobs as failed when Gotenberg is unavailable and restore that service before retrying.

## Mail and broadcasting

The template uses `MAIL_MAILER=log` and `BROADCAST_CONNECTION=log` so first boot needs no third-party credentials. Configure an authenticated production mail transport before relying on invitations, password resets, or notifications. Do not claim email delivery is working until a real message is verified.

## Optional observability and search

Telescope, Pulse, Nightwatch, Sentry, and external search are disabled by default in the production template. Enable one service at a time, read its upstream privacy and retention documentation, and configure authentication before exposing any dashboard. Secrets for optional services do not belong in examples or commits.

## Startup controls

Keep `RUN_MIGRATIONS=false`. Database migrations are explicit install and upgrade steps. `RUN_SCOUT_SETTINGS` and `RUN_DOCKER_SCRIPTS` are also disabled in the baseline; invoke maintenance work deliberately and observe it to completion.
