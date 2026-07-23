# Changelog

Notable project changes are recorded here. KoAkademy follows semantic versioning for stable releases where practical; because the project is beta, documented APIs and operational contracts can still change between releases and will be called out.

## Unreleased

### Added

- One-line Bash and PowerShell installers for a default Docker Swarm deployment
- Runtime stable-tag discovery for KoAkademy and optional local RustFS
- Docker-secret-backed PostgreSQL, Redis, object storage, migration jobs, and first-run health verification
- Supported production Compose topology with KoAkademy, PostgreSQL, Redis, and Gotenberg
- Canonical self-hosting, deployment, configuration, troubleshooting, architecture, FAQ, security, and contribution documentation
- Deterministic root-Markdown-to-MDX synchronization with CI drift checks
- Secret-free CI covering PHP formatting, Pest, frontend and Astro builds, docs checks, Compose validation, and shell syntax
- Production contract tests for host validation, safe environment values, service exposure, setup onboarding, PDF rendering, metadata, and API documentation

### Changed

- Self-hosting now defaults to manager-pinned Swarm services with host ports for KoAkademy and optional RustFS; Compose remains the manual path
- GitHub Pages deployment is paused while the repository is private
- Production onboarding now uses the real `/setup` wizard
- Production migrations are an explicit operator action and are disabled on container startup by default
- Trusted hosts derive from configured application/portal/admin hosts, with optional additional exact hosts
- Production uploads require S3-compatible storage, either external or the optional local RustFS service
- `spatie/laravel-pdf` uses Gotenberg without an unavailable DOMPDF fallback
- Updated the locked Guzzle, passkey, and WebAuthn dependency chain to clear known security advisories
- Package and container metadata consistently identify KoAkademy and AGPL-3.0-or-later
- Public API documentation is limited to the tested settings and student-verification subset

### Removed

- Devcontainer instructions for a `.devcontainer/` implementation that does not exist
- Fictional student CRUD API documentation
- Project-specific credentials and unsafe development values from the production environment example

## Released versions

Release-specific notes before this changelog was introduced remain available on [GitHub Releases](https://github.com/yukazakiri/koakademy/releases). They are not reconstructed here because doing so would invent historical detail.
