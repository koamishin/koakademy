# OSS Readiness Audit

## Result

- Baseline: **43/100**
- Current rubric result: **96/100**
- Verdict: **ready for a production-capable beta release after CI passes on the release commit**
- Fail gates: **none open**

## Score

| Area | Score | Evidence |
| --- | ---: | --- |
| Correctness and code alignment | 40/40 | Production topology, environment, host/proxy behavior, setup route, PDF driver, image metadata, Composer metadata, locked dependency audit, and published API subset align with repository code and contract tests. |
| Validation and reproducibility | 18/20 | Locked installs, secret-free CI, Pest, Pint, frontend/Astro builds, doc parity/link checks, Compose validation, shell checks, and the PHP dependency audit pass locally. Full deployment still requires operator-owned DNS, HTTPS, S3, and credentials. |
| Contributor usability | 15/15 | Concise README, canonical docs, deterministic mirrors, contribution workflow, architecture, FAQ, changelog, and troubleshooting are present. |
| Security and operational clarity | 13/15 | Safe production defaults, private services, loopback origin, explicit migrations, secure sessions, trusted hosts/proxies, backup/upgrade guidance, and private disclosure are documented. Institution-specific threat/compliance review remains operator work. |
| License and metadata | 10/10 | Existing AGPL license text is retained and root/module/npm/OCI metadata consistently identify AGPL-3.0-or-later and KoAkademy. |
| **Total** | **96/100** | Target of at least 90 met. |

## Resolved fail gates

1. Removed fictional student CRUD endpoints and the shared fictional API hostname from public docs.
2. Replaced `APP_ENV=local`, debug mode, insecure sessions, public service ports, and project credentials in the production example.
3. Added a production Compose topology whose only host binding is `127.0.0.1:8000`.
4. Replaced automatic startup migrations with explicit install/upgrade commands and `RUN_MIGRATIONS=false`.
5. Replaced the incorrect first-admin command with the tested `/setup` wizard.
6. Replaced hard-coded test hosts with exact patterns derived from public configuration and exposed trusted proxies.
7. Standardized Docker, Composer, module, npm, README, and license metadata on KoAkademy and AGPL-3.0-or-later.
8. Removed stale devcontainer guidance for an implementation absent from the repository.
9. Replaced unavailable DOMPDF fallbacks with the supported `spatie/laravel-pdf` Gotenberg driver.

## Ranked cleanup queue

### Release blockers

None identified by the current rubric. The release commit must still pass the new CI workflow.

### Next improvements

1. Add a real fresh-install smoke job using the released image, PostgreSQL, Redis, and Gotenberg when registry timing permits it without secrets.
2. Add PostgreSQL-specific integration coverage for features that depend on PostgreSQL behavior.
3. Expand public API docs only endpoint by endpoint after authorization and response contracts are tested.
4. Decide whether to adopt a Code of Conduct and document maintainership/governance expectations.

## Validation record

The validation commands and observed results are maintained in `OSS_HARDENING_STATUS.md`. CI repeats the reproducible, secret-free subset on every push and pull request.

## Next review loop

Rerun `npm run docs:check`, the CI-equivalent commands in `OSS_CI.md`, and this rubric after any change to deployment files, environment variables, routes, setup, PDF configuration, license metadata, or canonical docs.
