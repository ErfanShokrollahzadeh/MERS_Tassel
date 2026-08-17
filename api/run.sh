#!/usr/bin/env bash
#
# Start the API using a .NET SDK that can actually build it.
#
# `dotnet run` on its own uses whichever dotnet is first on PATH, which on a machine with
# several SDKs is usually an older one that cannot build net10.0. This resolves a suitable
# SDK first — installing one under ~/.dotnet if the machine has none — and runs the API
# with that. Works from any directory; arguments are forwarded to `dotnet run`.

set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

DOTNET="$(python3 "$REPO_ROOT/scripts/dotnet_sdk.py")"
DOTNET_ROOT="$(dirname -- "$DOTNET")"
export DOTNET_ROOT
export PATH="$DOTNET_ROOT:$PATH"

cd -- "$REPO_ROOT/api/src/MersTassel.Api"
exec "$DOTNET" run "$@"
