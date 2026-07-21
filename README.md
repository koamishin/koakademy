# KoAkademy

KoAkademy is a self-hosted school administration and learning platform built with Laravel, Filament, Inertia, and React. It combines enrollment workflows, student and faculty records, classes, schedules, grading, announcements, and optional institutional modules in one application.

> **Project status: production-capable beta.** KoAkademy has a documented production topology and automated tests, but operators should validate upgrades in staging, maintain backups, and review the security model for their institution. Only the latest stable release is supported.

## Verified capabilities

- Guided first-run setup for the institution and initial super administrator
- Student, faculty, course, class, schedule, enrollment, and grade administration
- Role- and permission-aware administration through Filament
- Enrollment blueprints and workflow configuration
- Announcements, notifications, exports, and Gotenberg-backed PDF generation
- Optional inventory, library, cashier, and student medical-record modules
- Public settings, authenticated settings, and authenticated student-verification APIs

The API surface is beta. Only endpoints listed in the [API documentation](docs/src/content/docs/api/api-overview.mdx) are part of the documented public contract.

## Supported production topology

The supported container topology is:

- KoAkademy application image (PHP 8.5 with FrankenPHP)
- PostgreSQL
- Redis for cache, sessions, and queues
- Gotenberg for `spatie/laravel-pdf`
- External S3-compatible object storage for uploads
- An operator-managed HTTPS edge such as Caddy, Nginx, Traefik, or a tunnel

`compose.production.yaml` publishes the application only on `127.0.0.1:8000`. PostgreSQL, Redis, and Gotenberg are not published to the host. The primary routing model uses one hostname with administration at `/admin`.

## Quick start

Requirements: Docker Engine with Compose v2, an HTTPS hostname, and an S3-compatible bucket.

```sh
cp .env.production.example .env
# Replace every change-me value and school.example in .env.

docker compose --env-file .env -f compose.production.yaml config --quiet
docker compose --env-file .env -f compose.production.yaml pull
docker compose --env-file .env -f compose.production.yaml up -d postgres redis gotenberg

docker compose --env-file .env -f compose.production.yaml run --rm app php artisan key:generate --show
# Put the generated value in APP_KEY, then run the explicit database upgrade.
docker compose --env-file .env -f compose.production.yaml run --rm app php artisan migrate --force
docker compose --env-file .env -f compose.production.yaml up -d app
```

Verify the private origin:

```sh
curl --fail --silent --show-error http://127.0.0.1:8000/up
```

Configure your HTTPS edge to proxy to `http://127.0.0.1:8000`, then open `https://school.example/setup`. The setup wizard creates the institution and first super administrator. Do not use `make:filament-user` for first-run installation.

See [Getting Started](GETTING_STARTED.md) and [Deployment](DEPLOYMENT.md) before exposing the service.

## Documentation

- [Configuration](CONFIGURATION.md)
- [Architecture](ARCHITECTURE.md)
- [Operations and troubleshooting](TROUBLESHOOTING.md)
- [Native development](DEVELOPMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Frequently asked questions](FAQ.md)
- [Changelog](CHANGELOG.md)
- [Hosted documentation](https://koakademy.github.io/koakademy/)

Root Markdown files are canonical for technical and project documentation. Marked MDX copies are generated for Astro and the in-app documentation; run `npm run docs:sync` after editing a canonical file.

## Contributing and security

Bug reports and pull requests are welcome; start with [CONTRIBUTING.md](CONTRIBUTING.md). Do not report suspected vulnerabilities in public issues—follow [SECURITY.md](SECURITY.md) and use GitHub Security Advisories.

## License

KoAkademy is licensed under [GNU AGPL-3.0-or-later](LICENSE.md). Network users must be offered the corresponding source code for the version they are using, including your modifications.
