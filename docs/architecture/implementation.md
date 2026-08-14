# MERS Tassel implementation architecture

## Runtime boundaries

- `client` owns the storefront and staff workspaces. Public catalog surfaces are server-renderable; mutable commerce interfaces use local query state and typed domain fixtures when the API is unavailable.
- `server/products` owns catalog content, variants, media, and sellable inventory identity.
- `server/commerce` owns carts, checkout sessions, immutable order snapshots, promotions, inventory reservations, and webhook-driven fulfillment.
- `server/support` owns tickets, internal notes, attachments, assignments, and SLA state.
- `server/analytics` owns append-only funnel events and daily aggregates.

## Consistency rules

1. Prices use Django decimals at rest and whole display values in the current UI fixtures. Production API clients must parse money as strings, never floating point.
2. Stripe Checkout accepts product identity and quantity only. The server locks variants, prices every item from the database, reserves available stock, and sends whole-cent values to Stripe.
3. Order items snapshot product name, SKU, quantity, and price so catalog edits cannot rewrite order history.
4. Staff permissions are enforced by API permission classes. Frontend visibility is not authorization.
5. Support notes carry an explicit `is_internal` flag. Customer delivery code must filter these records.
6. Card data never enters the application. Hosted Stripe Checkout handles payment collection.
7. Webhooks are verified from the raw body with the endpoint secret. Stripe event IDs make fulfillment idempotent; paid reservations convert to stock decrements, while failed or expired sessions release them.

## Frontend state

- URL: catalog category, search intent, sorting, and workspace filters.
- Zustand persistence: guest cart lines only. Drawer and toast visibility remain transient.
- TanStack Query: the remote-state boundary prepared for Django-backed screens.
- React Hook Form and Zod: checkout contact validation; Stripe securely collects address and payment details.
- Component-local state: transient panels, tabs, selection, and mock workspace interactions.

## Performance guardrails

- Glass blur is centralized on foreground bars, drawers, and overlays.
- Product cards use opaque/translucent surfaces without per-card backdrop filters.
- Animations use transform and opacity, respect reduced motion, and avoid scroll-driven React state.
- Responsive images use fixed aspect-ratio containers, `next/image` sizing hints, and skeleton states to limit layout shift.
- Charts are isolated to admin routes and excluded from storefront route bundles.
- Tables remain horizontally scrollable, with virtualization planned once a collection exceeds 200 visible rows.
