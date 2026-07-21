# OSS CI Contract

`.github/workflows/ci.yml` is the secret-free pull-request and push validation workflow. It uses PHP 8.5 and Node.js 22 and does not depend on deployment credentials or third-party application accounts.

## Required checks

1. Install locked Composer, root npm, and Astro npm dependencies with caches.
2. Audit the locked PHP dependency graph for known security advisories.
3. Run `vendor/bin/pint --test`.
4. Run the parallel Pest suite.
5. Build the application frontend.
6. Check generated documentation parity and local documentation links.
7. Build the Astro documentation site.
8. Validate `compose.production.yaml` with `.env.production.example`.
9. Parse production shell entrypoints with `sh -n`.

The workflow uses SQLite, array cache/session/mail, synchronous queues, and disabled optional observability in tests. PostgreSQL integration coverage can be added when a tested feature depends on PostgreSQL-specific behavior; the baseline remains secret-free.

## Local equivalent

```sh
composer install --no-interaction --prefer-dist --no-progress
composer audit --locked
npm ci
npm --prefix docs ci
vendor/bin/pint --test
php artisan test --parallel --compact
npm run build
npm run docs:check
npm --prefix docs run build
docker compose --env-file .env.production.example -f compose.production.yaml config --quiet
sh -n docker/start-container docker/healthcheck docker/pulse-process docker/run-scripts.sh docker/run.sh docker/docker-scripts/*.sh
```

CI validates reproducibility; it does not deploy, publish packages, use production secrets, or prove an institution's capacity/security requirements.
