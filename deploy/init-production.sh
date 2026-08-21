#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
secret_dir="$repo_dir/deploy/secrets"

mkdir -p "$secret_dir" "$repo_dir/deploy/backups"
chmod 0700 "$secret_dir" "$repo_dir/deploy/backups"

create_secret() {
  target=$1
  value=$2
  if [ ! -e "$target" ]; then
    umask 077
    printf '%s' "$value" > "$target"
  fi
}

create_secret "$secret_dir/postgres_password.txt" "$(openssl rand -base64 36 | tr -d '\n')"
create_secret "$secret_dir/jwt_signing_key.txt" "$(openssl rand -base64 64 | tr -d '\n')"
create_secret "$secret_dir/admin_password.txt" "$(openssl rand -hex 20)aA9!"
create_secret "$secret_dir/django_secret_key.txt" "$(openssl rand -base64 64 | tr -d '\n')"
create_secret "$secret_dir/gmail_app_password.txt" ""
create_secret "$secret_dir/stripe_secret_key.txt" ""
create_secret "$secret_dir/stripe_webhook_secret.txt" ""

if [ ! -e "$repo_dir/.env.production" ]; then
  cp "$repo_dir/.env.production.example" "$repo_dir/.env.production"
  chmod 0600 "$repo_dir/.env.production"
fi

printf '%s\n' \
  'Production files initialized.' \
  '1. Edit .env.production with the real domains.' \
  '2. Add Gmail/Stripe credentials under deploy/secrets when ready.' \
  '3. Keep every file in deploy/secrets private.'
