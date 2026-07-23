# Open-Source CI Contract

The primary workflow is [`.github/workflows/ci.yml`](.github/workflows/ci.yml). It runs for every push and pull request, cancels superseded runs on the same ref, and requires no repository secrets or live application services.

## Blocking job

The single `validate` job uses Ubuntu 24.04, PHP 8.5, Node.js 22, SQLite in memory, and safe local drivers for cache, sessions, queues, mail, broadcasting, search, and optional observability.

It blocks on:

1. Composer install and locked dependency audit
2. `npm ci` for the application and documentation site
3. PHP formatting with Pint
4. Application frontend build
5. Parallel Pest suite
6. Generated-document and local-link validation
7. Astro documentation build
8. Production Compose validation
9. POSIX shell, Bash, ShellCheck, and PowerShell installer validation

Composer downloads and both npm lockfiles participate in dependency caching. Any failed command fails the job; checks are not allowed to continue silently.

## Local reproduction

Install the toolchain from [DEVELOPMENT.md](DEVELOPMENT.md), then run:

```sh
composer install
npm ci
npm --prefix docs ci
vendor/bin/pint --test
npm run build
php artisan test --parallel --compact
npm run docs:check
npm --prefix docs run build
docker compose --env-file .env.production.example -f compose.production.yaml config --quiet
bash -n scripts/install.sh
shellcheck scripts/install.sh tests/Fixtures/installer/docker tests/Fixtures/installer/curl
```

The workflow also parses `scripts/install.ps1` with PowerShell's AST parser. The installer contract test uses a fake Docker CLI, so CI never creates or mutates a real Swarm.

## Known follow-ups

- Triage existing npm audit findings deliberately; do not apply an unreviewed forced upgrade.
- The current icon package declares a Node 24 engine even though it installs with a warning on the supported Node 22 toolchain. Either move the full toolchain together or pin a verified compatible package version.
- Release and deployment workflows are intentionally separate from the blocking, secret-free CI job.
