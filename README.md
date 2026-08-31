# MERS Tassel

A commerce platform for handcrafted accessories: a storefront for customers and an atelier
workspace for managing the catalog, orders and site content.

## Stack

- **API** — .NET 10, ASP.NET Core, EF Core, ASP.NET Core Identity, Stripe.net
- **Client** — Next.js 16, React 19, strict TypeScript, TanStack Query, Zustand, Framer Motion, Recharts
- **Production** — PostgreSQL 18, Caddy TLS ingress, Docker Compose; Next.js on Vercel

The API lives in `api/` and the client in `client/`. The original Django backend is still in
`server/` for reference; nothing in the client talks to it any more.

## Production deployment

Production Dockerfiles and the complete Compose stack are included. The active .NET API and the
legacy Django service use separate PostgreSQL databases, only Caddy is internet-facing, and the
Next.js storefront deploys independently to Vercel. Start with [the deployment runbook](docs/deployment.md).

## What works

### Storefront

- Editorial home page with hero, categories and featured pieces, all from the API
- Catalog with server-side search, category filter, sorting and pagination
- Product detail with a media gallery, per-finish stock and related pieces
- Persistent shopping bag, checkout, order history and account
- English/Turkish throughout, including product copy — translations are stored per record,
  so anything added in the admin panel can be localized
- Loading skeletons, empty states and error fallbacks on every data-backed view

### Atelier workspace (`/admin`)

- Administrator-only, guarded by role
- Overview with revenue, orders, average order value and inventory, computed from real orders
- Product management: create, edit and remove, with drag-and-drop image upload, live previews,
  cover-image selection, per-finish variants and EN/TR fields
- Order management with filters, search, expandable detail and status transitions that return
  stock when an order is cancelled or refunded
- People and roles, and a site-settings page for the logo, hero banner and contact details

Support is fully connected for customers and the atelier team, including ticket history, replies, private notes, priorities, status workflow, order context, assignment data, and search. Growth remains planned; Promotions is backed by coupon management.

## Local setup

### API

```bash
./api/run.sh
```

That is the whole thing. It picks a .NET SDK that can build the project and starts the API
with it — and if the machine has none, it installs one under `~/.dotnet` first (per-user, no
`sudo`, nothing else on the machine touched). `npm run dev` in `client/` does the same before
starting either server.

Both matter because the projects target `net10.0` and use EF Core 10, which no earlier SDK
can build, and because the .NET host only sees SDKs installed next to the `dotnet` binary you
invoked. So a plain `dotnet run` on a machine carrying 6.0 on `PATH` and 10.0 in `~/.dotnet`
still fails, with either `NETSDK1045` or *"a compatible installed .NET SDK for global.json
version [10.0.100] ... was not found"*. When that happens the API never starts, and the only
thing you see is a storefront with no images — nothing is serving `/uploads`.

To install the SDK without starting anything, or to see what is currently found:

```bash
python3 scripts/dotnet_sdk.py           # installs if needed, prints the dotnet it will use
python3 scripts/dotnet_sdk.py --check   # look only, never install
```

Set `MERS_SKIP_DOTNET_INSTALL=1` to keep it from installing anything, or install manually
from [dotnet.microsoft.com/download/dotnet/10.0](https://dotnet.microsoft.com/download/dotnet/10.0).
Several SDK versions coexist happily; `api/global.json` selects 10.x for this solution. To use
`dotnet` directly in a shell, put the resolved SDK first on `PATH`:

```bash
export PATH="$HOME/.dotnet:$PATH"   # then: cd api/src/MersTassel.Api && dotnet run
```

The API listens on `http://localhost:5080`, with Swagger at `/swagger` in development.

On first run it applies migrations, seeds the catalog from `api/seed-assets/`, and creates an
administrator. **The generated password is printed to the console once** — save it, or set your
own beforehand:

```bash
export Seed__AdminEmail=you@example.com
export Seed__AdminPassword='your-password'
```

### Client

```bash
cd client
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5080
npm run dev
```

The storefront runs at `http://localhost:3000` and the workspace at `/admin`.

`npm run dev` starts the API and the client together. To run only the client, use `npm run dev:next`.

### Recover or reset the administrator

Use the recovery flag for one startup when an existing account needs administrator access or
the administrator password has been lost. From the repository root:

```bash
Seed__AdminEmail='you@example.com' \
Seed__AdminPassword='choose-a-new-strong-password' \
Seed__ResetAdminPassword='true' \
npm --prefix client run dev
```

After the API reports that administrator access was recovered, stop it and start normally again.
Do not leave `Seed__ResetAdminPassword` enabled. This recovery promotes the configured account,
clears its lockout, and changes its password without deleting orders, customers, or catalog data.

## Configuration

Set through `appsettings.json`, environment variables or user-secrets. Nested keys use `__` in
environment variables (`Jwt__SigningKey`).

| Key | Purpose |
| --- | --- |
| `ConnectionStrings:Default` | Explicit SQLite connection string (optional locally) |
| `ConnectionStrings:PostgreSQL` | Explicit PostgreSQL connection string (optional alternative to the individual Docker values) |
| `Database:Provider` | `Sqlite` locally or `PostgreSQL` in production |
| `Database:Host` / `Port` / `Name` / `Username` / `Password` | PostgreSQL connection values; the password is a Docker secret in production |
| `Jwt:SigningKey` | Token signing key. **Required outside Development** — the API refuses to start without it |
| `Jwt:AccessTokenMinutes` / `Jwt:RefreshTokenDays` | Token lifetimes (default 15 minutes / 7 days) |
| `Cors:AllowedOrigins` | Origins allowed to call the API |
| `Storage:MaxBytes` | Upload size limit (default 10 MB) |
| `Stripe:SecretKey` / `Stripe:WebhookSecret` | Enables payments; without both, checkout returns a `payments_not_configured` 503 |
| `Email:Username` / `Email:AppPassword` | Gmail SMTP account and app password used by the contact form |
| `Email:Recipient` | Contact-form inbox (default `merstassel@gmail.com`) |
| `Seed:AdminEmail` / `Seed:AdminPassword` | Administrator seeded on first run |
| `Seed:ResetAdminPassword` | One-time recovery flag: promotes the configured email to Admin and resets its password; disable immediately after a successful start |

Never expose `Stripe:SecretKey` or `Jwt:SigningKey` through a `NEXT_PUBLIC_` variable.

### Contact-form email

The contact form stores each attempt in `ContactMessages` and sends it to
`merstassel@gmail.com` through authenticated Gmail SMTP. Gmail requires an **app password**;
do not put the normal Gmail password in the project. Enable two-step verification on the sending
Google account, create an app password, then store it with .NET user-secrets:

```bash
DOTNET="$(python3 scripts/dotnet_sdk.py)"
"$DOTNET" user-secrets --project api/src/MersTassel.Api set "Email:Username" "merstassel@gmail.com"
"$DOTNET" user-secrets --project api/src/MersTassel.Api set "Email:AppPassword" "your-16-character-app-password"
```

Restart the development stack after setting the secrets. Messages are authenticated as the
configured Gmail account for reliable delivery, and the customer's address is placed in
`Reply-To`, so replying from the inbox answers the customer directly. Production deployments
should provide the same keys through secret environment variables such as `Email__Username`
and `Email__AppPassword`.

### Payments

Checkout writes the order and reserves stock before any payment provider is involved, so the
flow works without Stripe — the order is simply left unpaid. With keys configured, the client
is handed a Stripe Checkout session and the webhook marks the order paid.

Register the webhook at `/api/v1/payments/stripe/webhook` for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Locally, forward events and copy the printed `whsec_...` value into your configuration:

```bash
stripe listen --forward-to localhost:5080/api/v1/payments/stripe/webhook
```

## API shape

Every response uses the same envelope:

```json
{ "success": true, "data": { }, "message": null, "errors": null, "code": null }
```

Lists add `items`, `page`, `pageSize`, `total` and `totalPages`. Failures set `success: false`
with a `code` (`validation_failed`, `not_found`, `conflict`, `payments_not_configured`, …) and,
for validation errors, a per-field `errors` map keyed in camelCase.

Uploaded media is stored under `wwwroot/uploads/{entity}/{yyyy}/{MM}/` and returned as a
relative path such as `/uploads/products/2026/08/{guid}.jpg`; the client resolves it against
the API origin. Uploads are validated by magic bytes rather than by file extension.

Records are soft-deleted through an `isDelete` column with a global query filter, so removing a
product hides it from the storefront while order history keeps its reference.

## Verification

```bash
export PATH="$(dirname "$(python3 scripts/dotnet_sdk.py)"):$PATH"

cd api
dotnet build
dotnet test          # 47 unit and integration tests

cd ../client
npm run typecheck
npm run build
```
