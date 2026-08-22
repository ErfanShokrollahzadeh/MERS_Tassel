# ADR-002: Split Vercel frontend and containerized backend deployment

**Status:** Accepted  
**Date:** 2026-08-21  
**Decider:** MERS Tassel owner

## Context

The storefront is a Next.js application suited to Vercel, while the active commerce API is
ASP.NET Core and owns persistent uploads, background-safe database migrations, authentication,
orders, payments and contact email. The repository also contains a legacy Django/DRF service
that must remain deployable, although the storefront no longer calls it. Production data must
survive container replacement and neither database nor application ports should be exposed
directly.

## Decision

- Deploy `client/` to Vercel and point `NEXT_PUBLIC_API_URL` at `https://api.<domain>`.
- Run ASP.NET Core, Django, PostgreSQL and Caddy with Docker Compose on one Linux host.
- Give ASP.NET Core and Django separate PostgreSQL databases in one private PostgreSQL instance.
- Keep SQLite as the zero-dependency local/test provider; use a separate EF migration assembly
  for PostgreSQL so provider-specific migrations cannot corrupt one another.
- Publish only Caddy on ports 80/443. Caddy obtains and renews TLS certificates and proxies each
  backend by hostname.
- Keep database data, uploads, Django media, the ASP.NET Core data-protection key ring and Caddy
  certificates in named volumes.
- Mount credentials as read-only Docker secret files. Run application containers as non-root
  with read-only root filesystems and bounded CPU, memory, processes and logs.

## Options considered

| Option | Complexity | Durability | Assessment |
| --- | --- | --- | --- |
| Vercel + one Docker host + PostgreSQL | Medium | High | Selected; clear ownership and modest operating cost |
| Put everything, including Next.js, in Compose | Low | High | Loses Vercel preview/CDN workflow requested by owner |
| Keep SQLite in the API container | Low | Medium | Prevents safe horizontal growth and is awkward to back up consistently |
| Deploy both backends as public services | Medium | High | Unnecessary attack surface; Caddy should be the only ingress |

## Consequences

- DNS needs three records: the storefront domain to Vercel, plus API and legacy API subdomains
  to the Docker host.
- Production starts from PostgreSQL migrations and seeded catalog data. Existing local SQLite
  customer/order data requires an explicit one-time migration; it is never overwritten silently.
- Uploaded files still need backups because they are not stored in PostgreSQL.
- The current single-host design is appropriate for a small store. If traffic or availability
  requirements grow, PostgreSQL and object storage should move to managed services first.
