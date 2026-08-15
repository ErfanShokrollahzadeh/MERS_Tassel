# MERS Tassel

A commerce platform for handcrafted accessories: a storefront for customers and an atelier
workspace for managing the catalog, orders and site content.

## Stack

- **API** — .NET 10, ASP.NET Core, EF Core with SQLite, ASP.NET Core Identity, Stripe.net
- **Client** — Next.js 16, React 19, strict TypeScript, TanStack Query, Zustand, Framer Motion, Recharts

The API lives in `api/` and the client in `client/`. The original Django backend is still in
`server/` for reference; nothing in the client talks to it any more.

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

Growth, Promotions and Support have no backend yet. Those pages say so rather than showing
placeholder numbers.

## Local setup

### API

Install the .NET 10 SDK if you do not have it:

```bash
curl -fsSL https://builds.dotnet.microsoft.com/dotnet/scripts/v1/dotnet-install.sh | bash -s -- --channel 10.0
export PATH="$HOME/.dotnet:$PATH"
```

Then run it:

```bash
cd api/src/MersTassel.Api
dotnet run
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

## Configuration

Set through `appsettings.json`, environment variables or user-secrets. Nested keys use `__` in
environment variables (`Jwt__SigningKey`).

| Key | Purpose |
| --- | --- |
| `ConnectionStrings:Default` | SQLite connection string |
| `Jwt:SigningKey` | Token signing key. **Required outside Development** — the API refuses to start without it |
| `Jwt:AccessTokenMinutes` / `Jwt:RefreshTokenDays` | Token lifetimes (default 15 minutes / 7 days) |
| `Cors:AllowedOrigins` | Origins allowed to call the API |
| `Storage:MaxBytes` | Upload size limit (default 10 MB) |
| `Stripe:SecretKey` / `Stripe:WebhookSecret` | Enables payments; without both, checkout returns a `payments_not_configured` 503 |
| `Seed:AdminEmail` / `Seed:AdminPassword` | Administrator seeded on first run |

Never expose `Stripe:SecretKey` or `Jwt:SigningKey` through a `NEXT_PUBLIC_` variable.

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
cd api
dotnet build
dotnet test          # 47 unit and integration tests

cd ../client
npm run typecheck
npm run build
```
