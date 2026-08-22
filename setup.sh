#!/usr/bin/env bash
#
# MERS Tassel - one-shot local setup
# Run from the project root:  bash setup.sh
#
# Installs a .NET SDK that can build api/ (under ~/.dotnet, no admin rights) if the machine
# does not already have one, restores the API, and installs the client's npm packages.
# The Django backend in server/ is kept for reference only — nothing in the client uses it.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

echo "Setting up MERS Tassel..."
echo

echo "==> .NET SDK"
DOTNET="$(python3 "$REPO_ROOT/scripts/dotnet_sdk.py")"
DOTNET_ROOT="$(dirname -- "$DOTNET")"
export DOTNET_ROOT
export PATH="$DOTNET_ROOT:$PATH"
echo "    using $DOTNET"

echo "==> API packages"
"$DOTNET" restore "$REPO_ROOT/api/MersTassel.slnx"

echo "==> Client packages"
(cd "$REPO_ROOT/client" && npm install)

if [ ! -f "$REPO_ROOT/client/.env.local" ] && [ -f "$REPO_ROOT/client/.env.example" ]; then
  cp "$REPO_ROOT/client/.env.example" "$REPO_ROOT/client/.env.local"
  echo "    wrote client/.env.local"
fi

cat <<'DONE'

Setup complete.

  Start everything:   cd client && npm run dev
  API only:           ./api/run.sh

  Storefront:  http://localhost:3000
  Workspace:   http://localhost:3000/admin
  API:         http://localhost:5080  (Swagger at /swagger)

On the API's first run it seeds the catalog and prints a generated administrator password
once — copy it from the console, or set Seed__AdminEmail / Seed__AdminPassword beforehand.
DONE
