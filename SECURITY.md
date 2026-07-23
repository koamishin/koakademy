# Security Policy

## Supported versions

KoAkademy is a production-capable beta. Only the latest stable, non-prerelease release receives security fixes. Development branches, prereleases, and older releases are unsupported. Operators should subscribe to repository releases and security advisories, stage upgrades promptly, and keep a tested backup and rollback plan.

No response-time, remediation-time, or disclosure SLA is promised.

## Report a vulnerability privately

Use the repository's **Security** tab and open a private vulnerability report through [GitHub Security Advisories](https://github.com/yukazakiri/koakademy/security/advisories/new). Do not open a public issue, discussion, or pull request containing exploit details.

Include only what is necessary:

- Affected KoAkademy version and deployment topology
- Vulnerability type and security impact
- Minimal reproducible steps or proof of concept
- Preconditions, required role, and whether default configuration is affected
- Suggested mitigation, if known

Do not send real student/faculty data, production credentials, private keys, database dumps, session cookies, or unredacted logs. Reproduce with synthetic data whenever possible.

Maintainers will coordinate validation, remediation, release, and disclosure through the private advisory. Public disclosure should wait until a fix or mitigation is available and affected operators have had a reasonable opportunity to upgrade.

## Operational security baseline

The supported deployment assumes:

- HTTPS at an operator-managed edge
- Swarm host ports restricted to the intended HTTPS edge, or the manual Compose origin bound to `127.0.0.1:8000`
- PostgreSQL, Redis, and Gotenberg kept private
- `APP_ENV=production`, `APP_DEBUG=false`, and secure session cookies
- Exact trusted hosts and controlled trusted proxies
- S3-compatible storage with least-privilege credentials; local RustFS treated as a backed-up single-node service
- Explicit migrations, Swarm-state and data backups, monitoring, and regular restore tests

Review [Deployment](DEPLOYMENT.md) and [Configuration](CONFIGURATION.md). These defaults reduce common risk but do not certify an installation for any law, regulation, or institutional policy.

## Scope notes

Reports about vulnerabilities in KoAkademy code or its supported deployment contract are in scope. Reports that require an already-compromised host, unsupported modifications, social engineering, denial-of-service traffic volume without an application flaw, or third-party service policy disputes may be closed or redirected.

Third-party dependency vulnerabilities should identify the dependency, affected version, reachable code path, and upstream advisory. Automated scanner output without demonstrated applicability may not be actionable.
