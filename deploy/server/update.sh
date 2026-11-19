#!/usr/bin/env bash
# Pulls main from GitHub and rebuilds when it changed (run every 5 minutes by gojoline-update.timer).
# --force rebuilds even without new commits.
set -euo pipefail
cd /opt/gojoline
git fetch --quiet origin main
if [ "${1:-}" != "--force" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  exit 0
fi
git reset --quiet --hard origin/main
cd deploy/server
echo "$(date -u +%FT%TZ) deploying $(git rev-parse --short HEAD)"
# Build first: the old version keeps serving until the new image is ready.
docker compose build app
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
