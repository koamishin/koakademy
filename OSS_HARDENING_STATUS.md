# OSS Hardening Status

## State

- Workflow: targeted continuous hardening pass
- Current stage: complete
- Target: production-capable beta, AGPL-3.0-or-later, audit score at least 90
- Current rubric score: 96/100
- Fail gates: none open

## Stage artifacts

| Stage | Artifacts | Status |
| --- | --- | --- |
| Audit | `OSS_AUDIT.md` | Complete; baseline 43/100 and replacement rubric 96/100 |
| Production contract | `compose.production.yaml`, `.env.production.example`, hosting middleware support, Gotenberg config | Complete |
| Canonical docs | README and eight root technical/project documents | Complete |
| OSS metadata | `SECURITY.md`, `CHANGELOG.md`, `OSS_DOCS.md`, AGPL Composer/npm/OCI metadata | Complete |
| Documentation mirrors | `scripts/sync-docs.mjs`, generated MDX, `scripts/check-docs.mjs` | Complete |
| CI and tests | `.github/workflows/ci.yml`, production/documentation contract tests | Complete; local validation results below |

## Review loop

No external `requesting-code-review` or `receiving-code-review` automation is available in this workspace. The replacement review is the `oss-doc-audit` rubric, repository diff review, contract tests, deterministic docs check, Compose validation, frontend/Astro builds, and shell syntax validation. A GitHub CI run on the final commit remains the authoritative clean-run confirmation.

## Validation results

- `php artisan test --parallel --compact`: 948 tests passed with 5,225 assertions and no skips across 16 processes in 157.05 seconds.
- `vendor/bin/pint --test`: all 1,433 files passed.
- `npm run build`: 14,923 modules transformed and the production build completed in 6.69 seconds. Wayfinder was generated with the PHP 8.5 validation container because PHP is not installed on the host.
- `npm run docs:check`: generated mirrors were current and all 40 Markdown/MDX files passed local-link and drift validation.
- `npm --prefix docs run build`: all 26 pages built, with 25 pages indexed, in 3.21 seconds.
- `docker compose --env-file .env.production.example -f compose.production.yaml config --quiet`: passed. The configured Gotenberg image was also checked to confirm the `curl` health check is available.
- `actionlint .github/workflows/ci.yml`: passed with no findings.
- POSIX syntax checks passed for the production entrypoints, and Node syntax checks passed for both documentation scripts.
- `composer validate --no-check-publish`: passed with three pre-existing dependency-constraint warnings.
- `composer audit --locked`: no security vulnerability advisories found after updating the locked Guzzle and passkey/WebAuthn dependency chain.

An external fresh staging deployment was not run because it requires an operator-owned stable image tag, DNS/HTTPS routing, S3 credentials, and deployment secrets. The documented sequence and contract tests cover configuration, dependency startup, explicit migration, application startup, `/up`, `/setup`, and `/admin`; the complete sequence must still be exercised against the release image before publishing it as stable.

## Unresolved maintainer decisions

- Whether and which Code of Conduct to adopt
- Governance/maintainership policy beyond the current contribution process
- Whether additional internal APIs should receive stable public contracts

No SLA, compliance certification, performance benchmark, or cross-version compatibility guarantee has been created.

## Stop and rollback guidance

Stop a release if CI fails, `npm run docs:check` reports drift, Compose publishes a private dependency, the latest stable image does not match these deployment files, or a fresh staging install cannot complete `/setup` and reach `/admin`.

For an application upgrade, restore the matching pre-upgrade image and PostgreSQL backup together unless release notes explicitly confirm a code-only rollback is schema-compatible. Never use an unreviewed production `migrate:rollback` as the default recovery action.

## Next release gate

Push the release candidate and require the `CI` workflow to pass before publishing the stable image. Then exercise the documented fresh-deployment sequence with operator-owned DNS, HTTPS, S3, and secrets.
