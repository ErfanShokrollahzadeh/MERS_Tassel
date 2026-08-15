-- PostgreSQL reference schema for the MERS customer and shopping-bag domain.
-- The running Django application maps the same concepts across auth_user,
-- accounts_userprofile, commerce_cart, and commerce_cartitem.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
CREATE TYPE shopping_bag_status AS ENUM ('open', 'converted', 'abandoned');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(150) NOT NULL DEFAULT '',
    last_name VARCHAR(150) NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shopping_bags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status shopping_bag_status NOT NULL DEFAULT 'open',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_open_bag_per_user
    ON shopping_bags(user_id)
    WHERE status = 'open';

CREATE TABLE shopping_bag_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    bag_id UUID NOT NULL REFERENCES shopping_bags(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES products_productvariant(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_bag_item UNIQUE (bag_id, item_id)
);

CREATE INDEX idx_shopping_bag_items_bag_id ON shopping_bag_items(bag_id);
