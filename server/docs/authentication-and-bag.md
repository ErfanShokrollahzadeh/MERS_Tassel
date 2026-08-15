# Authentication and shopping-bag API

The running implementation uses Django REST Framework, SQLite locally, and signed JWT access/refresh tokens. Django stores password hashes in `auth_user.password`; `accounts_userprofile` adds the case-normalized unique email identity and `customer`, `staff`, or `admin` role. Bags and items are stored in `commerce_cart` and `commerce_cartitem`.

## Database invariants

- Passwords are created through Django's password hasher and are never stored as plaintext.
- Each profile has one unique email and a server-assigned role. Public signup can only create the `customer` role.
- Every open bag must have a user, and a user can have only one open bag.
- Bag items belong to a bag and a catalog variant. Deleting a user cascades through their bags; deleting a referenced variant is restricted.
- A variant can occur only once per bag, and item quantity is validated against inventory and the per-line limit.

Apply the schema with:

```bash
python manage.py migrate
```

## Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/accounts/register/` | Public | Create a customer; returns access token, refresh token, and user |
| `POST` | `/api/accounts/login/` | Public | Email/password login; returns access token, refresh token, and user |
| `POST` | `/api/accounts/token/refresh/` | Public with refresh token | Rotate an expired access token |
| `POST` | `/api/accounts/logout/` | Bearer JWT | Blacklist the submitted refresh token |
| `GET` | `/api/accounts/profile/` | Bearer JWT | Return the current user and role |
| `GET` | `/api/v1/commerce/shopping-bag/` | Bearer JWT | Fetch the current user's bag |
| `POST` | `/api/v1/commerce/shopping-bag/items/` | Bearer JWT | Add `{ product_slug, color, quantity }` |
| `PATCH` | `/api/v1/commerce/shopping-bag/items/:id/` | Bearer JWT | Set `{ quantity }` on an owned item |
| `DELETE` | `/api/v1/commerce/shopping-bag/items/:id/` | Bearer JWT | Remove an owned item |

Send access tokens as `Authorization: Bearer <access-token>`. Missing, expired, or invalid credentials return `401 Unauthorized`. All bag queries are additionally filtered by `request.user`, so guessing another bag or item ID cannot expose another customer's data. The storefront redirects anonymous bag and checkout attempts to `/login`; after login it reloads the durable server-side bag. Checkout creation also requires authentication and assigns the order to the authenticated user.
