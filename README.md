# MERS Tassel

A full-stack commerce and atelier-operations platform for handcrafted accessories. The experience combines a high-conversion storefront with a Liquid Glass staff workspace for orders, products, growth analytics, promotions, roles, and customer support.

## What is included

### Storefront

- Editorial home and collection discovery
- Searchable, filterable and sortable catalog
- Product detail gallery, finishes, stock state and related products
- Persistent slide-over bag with quantity controls, live delivery/tax estimates and focus management
- Stripe-hosted Checkout with server-authoritative pricing, payment confirmation and cancel recovery
- Responsive `next/image` media, loading skeletons, route/gallery/accordion transitions, light/dark themes and reduced-motion support
- Complete English/Turkish storefront localization with persisted language preference, localized catalog copy, validation, checkout outcomes and Stripe-hosted payment UI
- Product-specific Open Graph metadata and a bespoke social preview card

### Atelier workspace

- Revenue, order, conversion and customer KPI overview
- Order search, filters, batch selection and operational status
- Product/inventory table and rich product editor workflow
- Acquisition, attribution, funnel and cohort analytics
- Promotion library and discount builder
- Support inbox, accessible Kanban alternative, live thread, internal notes and customer context
- Staff roles and permission matrix
- Command palette and responsive/collapsible navigation

### Backend domains

- Catalog variants and product media
- Persistent carts and inventory-aware cart items
- Atomic checkout, immutable order-item snapshots and expiring inventory reservations
- Signed, idempotent Stripe webhooks that fulfill paid orders and release failed/expired reservations
- Promotions and redemption limits
- Ticketing, private internal notes, canned replies and attachments
- Commerce events, daily metrics and staff KPI endpoint
- Versioned `/api/v1/` routes alongside the original compatible endpoints

## Stack

- Next.js 16, React 19 and strict TypeScript
- Zustand, TanStack Query, React Hook Form and Zod
- Framer Motion, Recharts and Lucide
- Django 4.2 and Django REST Framework
- SQLite for local development; models are ready for PostgreSQL deployment

## Local setup

### Backend

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in the Stripe test keys, then export the file into this shell:
set -a; source .env; set +a
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API runs at `http://localhost:8000`. Django administration is at `/admin/`.

In another terminal, forward Stripe test events and copy the printed `whsec_...` value into `server/.env`:

```bash
stripe listen --forward-to localhost:8000/api/v1/commerce/stripe/webhook/
```

### Frontend

```bash
cd client
npm install
npm run dev
```

The product runs at `http://localhost:3000`; the atelier workspace begins at `/admin`.

Use the `EN / TR` control in the header, footer, account, or checkout screens to switch languages. The preference is stored in both a cookie and local browser storage, updates the document language for assistive technology, and is passed to Stripe so its hosted payment page opens in the selected language. Internal product slugs and variant values remain language-neutral for reliable inventory and order matching.

For a local end-to-end test, add an item, continue to Stripe Checkout, and use test card `4242 4242 4242 4242` with any future expiry and any CVC. The success page polls the local order until the verified webhook marks it paid; canceling keeps the persisted bag intact.

### Stripe webhook events

Register the production webhook URL `/api/v1/commerce/stripe/webhook/` for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` through a `NEXT_PUBLIC_` variable.

## Verification

```bash
cd client
npm run typecheck
npm run build

cd ../server
python manage.py check
python manage.py test commerce support analytics products accounts
```

Architecture and consistency rules are documented in [docs/architecture/implementation.md](docs/architecture/implementation.md). The design-system contract is in [docs/design-system.md](docs/design-system.md).
