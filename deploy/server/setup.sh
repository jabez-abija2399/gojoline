#!/usr/bin/env bash
# One-time server setup for Gojoline (Ubuntu 24.04, run as root: sudo bash setup.sh).
# Safe to run again. See README.md for the steps before and after.
set -euo pipefail

APP_DIR=/opt/gojoline
REPO=${REPO:-git@github.com:jabez-abija2399/gojoline.git}

echo "== 1/6 System updates and security patches (automatic from now on)"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git unattended-upgrades ufw
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== 2/6 Swap (2 GB): building the app needs more memory than the server has free"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== 3/6 Firewall: only SSH, HTTP and HTTPS"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "== 4/6 Docker"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "== 5/6 The code"
# The server reads the private repo with its own read-only deploy key (README.md, step 4).
if [ ! -f /root/.ssh/id_ed25519 ]; then
  mkdir -p /root/.ssh && chmod 700 /root/.ssh
  ssh-keygen -q -t ed25519 -N "" -C "gojoline-server" -f /root/.ssh/id_ed25519
fi
# GitHub's published host key (docs.github.com, "GitHub's SSH key fingerprints"), pinned, not trusted on first use.
grep -q '^github.com ssh-ed25519 ' /root/.ssh/known_hosts 2>/dev/null || echo 'github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl' >> /root/.ssh/known_hosts
if [ ! -d "$APP_DIR/.git" ]; then
  if ! git clone --branch main "$REPO" "$APP_DIR"; then
    echo
    echo "GitHub refused: add this key to the repo (Settings → Deploy keys → Add deploy key, read-only):"
    echo
    cat /root/.ssh/id_ed25519.pub
    echo
    echo "Then run: sudo bash setup.sh"
    exit 1
  fi
fi
cd "$APP_DIR/deploy/server"
if [ ! -f .env ]; then
  cp env.example .env
  chmod 600 .env
  echo
  echo "Created $APP_DIR/deploy/server/.env. Fill it in (nano .env), then run: sudo bash setup.sh"
  exit 0
fi
chmod 600 .env
# The app and the sandbox runner share a secret, made here once.
if ! grep -q '^SANDBOX_RUNNER_SECRET=.\+' .env; then
  sed -i '/^SANDBOX_RUNNER_SECRET=/d' .env
  echo "SANDBOX_RUNNER_SECRET=$(openssl rand -hex 32)" >> .env
fi
# Without these the site can't start or (rate limits fail closed) nobody can sign in.
missing=""
for k in APP_DOMAIN DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_URL NEXT_PUBLIC_APP_URL UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN CRON_SECRET; do
  v=$(grep "^$k=" .env | cut -d= -f2- || true)
  [ -n "$v" ] || missing="$missing $k"
done
if [ -n "$missing" ]; then
  echo "Fill these in .env first:$missing"
  exit 1
fi

echo "== 6/6 Build, start, then automatic updates (every 5 minutes), weekly refresh and the daily job"
# The scripts that run as root are copied out of the repo: a commit can't change them.
install -m 0755 update.sh /usr/local/sbin/gojoline-update
install -m 0755 daily.sh /usr/local/sbin/gojoline-daily
install -m 0755 posts.sh /usr/local/sbin/gojoline-posts
install -m 0644 gojoline-update.service gojoline-update.timer gojoline-daily.service gojoline-daily.timer gojoline-refresh.service gojoline-refresh.timer gojoline-posts.service gojoline-posts.timer /etc/systemd/system/
systemctl daemon-reload
echo "Building and starting (the first build takes 5 to 10 minutes)..."
/usr/local/sbin/gojoline-update --force
# Timers only after the first deploy, so two builds never overlap.
systemctl enable --now gojoline-update.timer gojoline-daily.timer gojoline-refresh.timer gojoline-posts.timer
echo
echo "Done. Once DNS points here, check: curl -s https://$(grep ^APP_DOMAIN= .env | cut -d= -f2-)/api/health"
