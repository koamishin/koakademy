# Open-Source Documentation Readiness

This file tracks the public adoption contract without duplicating the operator and contributor guides.

## README checklist

- [x] Explains what KoAkademy does and its production-capable beta status
- [x] Provides one-line Linux and Windows installation commands
- [x] Links the manual Compose path and supported production topology
- [x] Explains that the installer verifies `/up` before reporting success
- [x] Links contribution, development, security, architecture, and deeper operator documentation
- [x] States the AGPL-3.0-or-later network-source obligation

## FAQ coverage

[FAQ.md](FAQ.md) covers the supported release, production database, installer effects, exposed ports, setup wizard, migration policy, PDF renderer, storage choices, API stability, vulnerability reporting, and support expectations. New recurring installation questions should be added there only after the behavior is confirmed in code or an installer test.

## Architecture documentation

[ARCHITECTURE.md](ARCHITECTURE.md) documents the modular monolith, Swarm and Compose runtime views, tenancy context, authorization, durable state, queues, PDFs, documentation ownership, and extension boundaries. Deployment-specific failure behavior belongs in [TROUBLESHOOTING.md](TROUBLESHOOTING.md), not in the architecture overview.

## Licensing, citation, and reproducibility

- [LICENSE.md](LICENSE.md) is GNU AGPL-3.0-or-later; package and image metadata use the same identifier.
- KoAkademy is an application rather than a paper, dataset, benchmark, or model release, so `CITATION.cff` is not currently required.
- Reproducible releases use immutable stable Git tags, matching GHCR tags, `version.json`, release notes, and the CI workflow.
- Public release verification must test the raw installer and stable container image from a logged-out environment.

## Intentionally deferred

- GitHub Pages remains disabled while the repository is private. Re-enable it using [DEVELOPMENT.md](DEVELOPMENT.md) after the repository becomes public.
- The one-line command installs a fresh deployment but intentionally does not perform upgrades or uninstall an existing installation. A dedicated, backup-aware Swarm upgrade command is future work.
- Automated TLS, multi-node storage high availability, ARM64 images, compliance certification, and a support SLA are not claimed.

## Public-release gate

Before advertising the self-hosted installer:

1. Make the repository and linked GHCR package public.
2. Publish a stable KoAkademy release containing the reviewed installer contract.
3. Run the unauthenticated one-line command on a fresh Linux host and a fresh Windows Docker Desktop machine.
4. Exercise both local RustFS and external S3-compatible storage.
5. Complete `/setup`, upload and retrieve a file, generate a PDF, run a queued job, restart the services, and restore a backup.
6. Confirm CI passes and the installer, stable image, and documentation links resolve without maintainer credentials.
