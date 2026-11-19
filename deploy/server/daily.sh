#!/usr/bin/env bash
# The daily job Vercel's cron used to run (vercel.json): roll visit counts into the database.
set -euo pipefail
cd /opt/gojoline/deploy/server
DOMAIN=$(grep '^APP_DOMAIN=' .env | cut -d= -f2-)
SECRET=$(grep '^CRON_SECRET=' .env | cut -d= -f2-)
curl -fsS --max-time 120 -H "Authorization: Bearer ${SECRET}" "https://${DOMAIN}/api/cron/visits"
