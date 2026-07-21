# Troubleshooting

Start with the smallest observable failure and preserve logs before restarting services.

## Useful diagnostics

```sh
docker compose --env-file .env -f compose.production.yaml ps
docker compose --env-file .env -f compose.production.yaml logs --tail=200 app
docker compose --env-file .env -f compose.production.yaml logs --tail=100 postgres redis gotenberg
curl --verbose http://127.0.0.1:8000/up
```

Never paste `.env`, access tokens, student data, database dumps, or unredacted production logs into a public issue.

## Compose rejects the configuration

Run:

```sh
docker compose --env-file .env -f compose.production.yaml config --quiet
```

Errors usually mean `.env` is missing, `DB_PASSWORD` or `REDIS_PASSWORD` is empty, or a value contains Compose interpolation characters that need escaping. Compare variable names with `.env.production.example`; do not copy values from that example unchanged.

## The application container does not become healthy

Check dependency health and application logs. Common causes are:

- Incorrect PostgreSQL or Redis password
- Missing or malformed `APP_KEY`
- Migrations were not run
- Incompatible image and deployment-file versions
- Unwritable application storage volume

Run the explicit migration after dependencies are healthy:

```sh
docker compose --env-file .env -f compose.production.yaml run --rm app php artisan migrate:status
docker compose --env-file .env -f compose.production.yaml run --rm app php artisan migrate --force
```

## `/up` works locally but the public site fails

The application is deliberately bound to loopback. Check the external proxy or tunnel, DNS, certificate, and forwarding headers. The edge must proxy to `127.0.0.1:8000`, not a database or container-private address.

Confirm `APP_URL`, `PORTAL_HOST`, and `ADMIN_HOST` match the public hostname. Add intentional aliases to `TRUSTED_HOSTS`. A rejected or unexpected host can produce an HTTP 400 response before application routing.

## Redirect loop or generated HTTP links behind HTTPS

Verify the edge sends `X-Forwarded-Proto: https` and its source is allowed by `TRUSTED_PROXIES`. Keep the origin loopback-only when using `TRUSTED_PROXIES=*`. Clear cached configuration after changing environment values:

```sh
docker compose --env-file .env -f compose.production.yaml exec app php artisan optimize:clear
docker compose --env-file .env -f compose.production.yaml restart app
```

## `/setup` is forbidden

The setup wizard is one-time. It returns `403` after core data or completed setup state exists. Use the normal `/admin` sign-in. Do not delete setup records to recreate an administrator; use supported password-reset or database recovery procedures.

If this happens on a genuinely empty database, verify the app is connected to the intended PostgreSQL database and inspect migration status.

## Uploads fail

Confirm `FILESYSTEM_DISK=s3`, the bucket exists, and the `AWS_*` endpoint, region, path-style, and credentials match the provider. Credentials need the operations used by uploads and deletes but should be limited to the installation's bucket. Check clocks on the host and provider when signatures expire unexpectedly.

## PDF generation fails

KoAkademy uses `spatie/laravel-pdf` with Gotenberg. There is no DOMPDF fallback. Check:

```sh
docker compose --env-file .env -f compose.production.yaml ps gotenberg
docker compose --env-file .env -f compose.production.yaml logs --tail=100 gotenberg app
```

`GOTENBERG_URL` must be `http://gotenberg:3000` in the supported Compose network. Restore Gotenberg, then retry the failed queued job according to your operational policy.

## Queued work does not run

Verify Redis health, `QUEUE_CONNECTION=redis`, and the application logs. Station workers run inside the application container in the production image. Avoid repeatedly dispatching the same export or notification until the original job state is understood.

## Asking for help

Search existing GitHub issues first. For a public bug report, include the KoAkademy version, deployment method, expected/actual behavior, sanitized logs, and minimal reproduction. Report security concerns privately according to [SECURITY.md](SECURITY.md).
