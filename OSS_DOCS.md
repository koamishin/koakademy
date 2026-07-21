# OSS Documentation Inventory

This file records the public documentation contract created by the OSS hardening pass.

## README checklist

- Project purpose and production-capable beta status
- Verified capabilities without invented compatibility or compliance claims
- Supported production services and one-host `/admin` routing
- Runnable quick-start sequence with explicit migrations and `/setup`
- Loopback `/up` verification
- Links to deeper installation, operations, development, contribution, and security docs
- AGPL-3.0-or-later network-use notice

## Canonical documentation

| Document | Responsibility |
| --- | --- |
| `GETTING_STARTED.md` | Supported first installation |
| `DEPLOYMENT.md` | Production, proxy, backup, upgrade, and rollback runbook |
| `CONFIGURATION.md` | Public environment and service contract |
| `TROUBLESHOOTING.md` | Evidence-first operational diagnostics |
| `DEVELOPMENT.md` | Native setup, tests, code, and docs workflow |
| `CONTRIBUTING.md` | Contribution and pull-request expectations |
| `ARCHITECTURE.md` | Runtime, boundaries, data, queues, and extension model |
| `FAQ.md` | Support, topology, setup, PDF, storage, API, and governance answers |
| `SECURITY.md` | Supported version and private disclosure process |
| `CHANGELOG.md` | Forward-looking release changes |

`scripts/sync-docs.mjs` generates marked MDX mirrors for Astro and the in-app reader. `scripts/check-docs.mjs` and `npm run docs:check` fail on stale mirrors, missing local file links, or reintroduced fictional student CRUD docs.

## Native Astro content

User/operator guidance and enrollment blueprints remain authored under `docs/src/content/docs/`. API pages are also native because they must track tested HTTP behavior. The public API subset is intentionally limited to public settings, authenticated settings, and student verification.

## FAQ draft disposition

The FAQ draft was promoted to `FAQ.md` and covers the questions most likely to block an evaluator or self-hosting operator. It avoids promises about SLAs, compliance, performance, or compatibility.

## Architecture recommendations disposition

The architecture note documents the existing modular monolith and supported dependencies. It recommends inward dependencies, explicit infrastructure boundaries, private service networking, durable PostgreSQL/S3 data planes, retry-safe jobs, and deliberate module coupling without claiming those ideals are universally complete in existing code.

## License, citation, and reproducibility

- Existing `LICENSE.md` is retained unchanged as the full GNU AGPL v3 text.
- Root Composer, npm, module Composer, and OCI image metadata use `AGPL-3.0-or-later`.
- Academic citation metadata is not applicable; KoAkademy is an application, not a paper-code release.
- Reproducibility is covered by locked dependencies, a pinned release/image instruction, Compose validation, CI, deterministic doc generation, explicit migrations, and a documented production topology.

## Explicitly deferred

- Code of Conduct selection and enforcement policy: maintainer governance decision
- Support SLA, compliance certification, benchmarks, and compatibility guarantees: not offered
- Documentation for additional internal API routes: requires route-specific authorization, tests, examples, and stability decision
- Additional databases in the prebuilt image: not supported by this pass
