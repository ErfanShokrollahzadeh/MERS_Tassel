#!/usr/bin/env python3
"""
Find a .NET SDK that can build `api/`, installing one privately if the machine has none.

Two things make this necessary rather than a convenience:

1. The API targets net10.0 and depends on EF Core 10, so any older SDK stops at
   `NETSDK1045` — or, now that `api/global.json` pins the version, at "a compatible
   installed .NET SDK ... was not found". Neither message can be configured away; the
   only fix is having the SDK.
2. The .NET host resolves SDKs *relative to the `dotnet` binary that was invoked*. A
   machine whose PATH points at /usr/local/share/dotnet cannot see an SDK installed in
   ~/.dotnet, so "install it and it works" is only true if something looks in both
   places. This module probes every well-known location and returns a full path.

Run directly to print that path (diagnostics go to stderr, so `$(dotnet_sdk.py)` is safe):

    python3 scripts/dotnet_sdk.py            # resolve, installing if needed
    python3 scripts/dotnet_sdk.py --check    # resolve only, never install
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GLOBAL_JSON = REPO_ROOT / 'api' / 'global.json'

# Used only if global.json is missing or unreadable; global.json is the source of truth.
FALLBACK_VERSION = (10, 0, 100)

IS_WINDOWS = os.name == 'nt'
HOST_NAME = 'dotnet.exe' if IS_WINDOWS else 'dotnet'
INSTALL_SCRIPT_URL = (
    'https://builds.dotnet.microsoft.com/dotnet/scripts/v1/dotnet-install.'
    + ('ps1' if IS_WINDOWS else 'sh')
)

# Where an SDK gets installed when one has to be fetched. This is the install script's own
# default and needs no privileges, so it never touches a system-managed .NET.
INSTALL_DIR = Path(os.environ.get('MERS_DOTNET_DIR') or Path.home() / '.dotnet')

SKIP_INSTALL_ENV = 'MERS_SKIP_DOTNET_INSTALL'

Version = tuple[int, int, int]


def parse_version(text: str) -> Version | None:
    """`10.0.400` and `10.0.100-rc.2.25451.107` both read as (10, 0, 100+)."""
    match = re.match(r'(\d+)\.(\d+)\.(\d+)', text.strip())
    return (int(match[1]), int(match[2]), int(match[3])) if match else None


def required_version() -> Version:
    try:
        pinned = json.loads(GLOBAL_JSON.read_text(encoding='utf-8'))['sdk']['version']
    except (OSError, ValueError, KeyError, TypeError):
        return FALLBACK_VERSION

    return parse_version(str(pinned)) or FALLBACK_VERSION


def candidate_hosts() -> list[Path]:
    """Every `dotnet` worth asking, PATH first so an already-working setup is left alone."""
    candidates: list[Path | None] = []

    on_path = shutil.which('dotnet')
    if on_path:
        candidates.append(Path(on_path))

    root = os.environ.get('DOTNET_ROOT')
    if root:
        candidates.append(Path(root) / HOST_NAME)

    candidates.append(INSTALL_DIR / HOST_NAME)

    if IS_WINDOWS:
        for variable in ('ProgramFiles', 'ProgramW6432', 'LOCALAPPDATA'):
            base = os.environ.get(variable)
            if base:
                candidates.append(Path(base) / 'dotnet' / HOST_NAME)
                candidates.append(Path(base) / 'Microsoft' / 'dotnet' / HOST_NAME)
    else:
        candidates += [
            Path('/usr/local/share/dotnet') / HOST_NAME,       # macOS installer
            Path('/usr/local/share/dotnet/x64') / HOST_NAME,   # x64 SDK on Apple silicon
            Path('/opt/homebrew/opt/dotnet/libexec') / HOST_NAME,
            Path('/usr/share/dotnet') / HOST_NAME,
            Path('/usr/lib/dotnet') / HOST_NAME,
        ]

    unique: list[Path] = []
    for candidate in candidates:
        if candidate and candidate not in unique and candidate.exists():
            unique.append(candidate)

    return unique


def sdk_versions(host: Path) -> list[Version]:
    """Versions reported by `dotnet --list-sdks`, e.g. [(6, 0, 100), (10, 0, 400)]."""
    try:
        listing = subprocess.run(
            [str(host), '--list-sdks'], capture_output=True, text=True, timeout=60,
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return []

    found = (parse_version(line.split(' ', 1)[0]) for line in listing.splitlines() if line.strip())
    return [version for version in found if version]


def find_host(required: Version) -> Path | None:
    for host in candidate_hosts():
        if any(version >= required for version in sdk_versions(host)):
            return host

    return None


def describe_installed() -> str:
    lines = []
    for host in candidate_hosts():
        versions = sdk_versions(host)
        rendered = ', '.join('.'.join(map(str, version)) for version in versions) or 'none'
        lines.append(f'  {host}: {rendered}')

    return '\n'.join(lines) or '  (no dotnet found)'


def download_install_script(destination: Path) -> None:
    """urllib first; curl covers environments where Python has no usable CA bundle."""
    try:
        with urllib.request.urlopen(INSTALL_SCRIPT_URL, timeout=120) as response:
            destination.write_bytes(response.read())
        return
    except Exception as error:  # noqa: BLE001 - any failure just means trying curl next
        print(f'  download via python failed ({error}); retrying with curl', file=sys.stderr)

    subprocess.run(
        ['curl', '-fsSL', INSTALL_SCRIPT_URL, '-o', str(destination)],
        check=True, timeout=120,
    )


def install(required: Version) -> Path | None:
    channel = f'{required[0]}.{required[1]}'
    print(
        f'\nNo .NET {required[0]} SDK found. Installing one for this project:\n'
        f'  channel:  {channel}\n'
        f'  location: {INSTALL_DIR}  (per-user, no admin rights, nothing else on the machine changes)\n'
        f'  download: ~200 MB, usually a minute or two\n'
        f'  skip it:  set {SKIP_INSTALL_ENV}=1\n',
        file=sys.stderr,
    )

    with tempfile.TemporaryDirectory() as workspace:
        script = Path(workspace) / Path(INSTALL_SCRIPT_URL).name
        try:
            download_install_script(script)
        except (OSError, subprocess.SubprocessError) as error:
            print(f'Could not download the .NET install script: {error}', file=sys.stderr)
            return None

        if IS_WINDOWS:
            command = [
                'powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', str(script),
                '-Channel', channel, '-InstallDir', str(INSTALL_DIR), '-NoPath',
            ]
        else:
            command = [
                'bash', str(script),
                '--channel', channel, '--install-dir', str(INSTALL_DIR), '--no-path',
            ]

        try:
            completed = subprocess.run(command)
        except OSError as error:
            print(f'Could not run the .NET install script: {error}', file=sys.stderr)
            return None

    if completed.returncode != 0:
        print('\nThe .NET install script failed.', file=sys.stderr)
        return None

    host = find_host(required)
    if host is None:
        print(
            '\nThe install script finished but no suitable SDK is visible afterwards. '
            'Installed SDKs:\n' + describe_installed(),
            file=sys.stderr,
        )

    return host


def ensure(allow_install: bool = True) -> Path | None:
    """The resolved `dotnet`, or None with an explanation already printed to stderr."""
    required = required_version()
    host = find_host(required)
    if host is not None:
        return host

    if not allow_install or os.environ.get(SKIP_INSTALL_ENV):
        version = '.'.join(map(str, required))
        print(
            f'\nThe .NET SDK {version} or newer is required to build api/, and none was found.\n'
            f'Installed SDKs:\n{describe_installed()}\n\n'
            'Install it with:\n'
            f'  python3 {Path(__file__).relative_to(REPO_ROOT)}\n'
            '  (or see https://dotnet.microsoft.com/download/dotnet/'
            f'{required[0]}.{required[1]})\n',
            file=sys.stderr,
        )
        return None

    return install(required)


def child_env(host: Path, base: dict[str, str] | None = None) -> dict[str, str]:
    """
    Environment for a process that should use `host`.

    DOTNET_ROOT and PATH both matter: MSBuild and the SDK shell out to `dotnet` by name,
    and without this a build started with ~/.dotnet/dotnet would hand its inner calls back
    to whatever older `dotnet` happens to be first on PATH.
    """
    environment = dict(os.environ if base is None else base)
    root = str(host.parent)
    environment['DOTNET_ROOT'] = root
    environment['PATH'] = root + os.pathsep + environment.get('PATH', '')
    return environment


def main() -> int:
    host = ensure(allow_install='--check' not in sys.argv[1:])
    if host is None:
        return 1

    print(host)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
