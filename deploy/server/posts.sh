#!/usr/bin/env bash
# Every 15 minutes: sends Admin → Posts posts whose time has come, and the Monday summary.
set -euo pipefail
ENV=/opt/gojoline/deploy/server/.env
DOMAIN=$(grep '^APP_DOMAIN=' "$ENV" | cut -d= -f2- | tr -d '\r')
SECRET=$(grep '^CRON_SECRET=' "$ENV" | cut -d= -f2- | tr -d '\r')
[ -n "$DOMAIN" ] && [ -n "$SECRET" ] || { echo "APP_DOMAIN or CRON_SECRET is empty in $ENV" >&2; exit 1; }
# The secret goes through stdin, never on the command line (visible in the process list).
printf 'Authorization: Bearer %s\n' "$SECRET" | curl -fsS --max-time 300 -H @- "https://${DOMAIN}/api/cron/posts"
