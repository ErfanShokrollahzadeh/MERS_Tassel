#!/bin/sh
set -eu

export PGPASSWORD="$(cat /run/secrets/postgres_password)"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="/backups/$stamp"
mkdir -p "$target"
chmod 0700 "$target"

pg_dump --format=custom --no-owner --dbname=merstassel > "$target/merstassel.dump"
pg_dump --format=custom --no-owner --dbname=merstassel_django > "$target/merstassel_django.dump"
tar -C /volumes/dotnet_uploads -czf "$target/dotnet_uploads.tar.gz" .
tar -C /volumes/dotnet_keys -czf "$target/dotnet_keys.tar.gz" .
tar -C /volumes/django_media -czf "$target/django_media.tar.gz" .
tar -C /volumes/support_attachment_data -czf "$target/support_attachments.tar.gz" .

find /backups -mindepth 1 -maxdepth 1 -type d -mtime "+${RETENTION_DAYS:-14}" -exec rm -rf -- {} +
printf 'Backup created: %s\n' "$target"
