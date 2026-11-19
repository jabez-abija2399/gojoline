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
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"
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

echo "== 6/6 Automatic updates from GitHub (every 5 minutes) and the daily visits job"
install -m 0644 gojoline-update.service gojoline-update.timer gojoline-daily.service gojoline-daily.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now gojoline-update.timer gojoline-daily.timer

echo "Building and starting (the first build takes 5 to 10 minutes)..."
bash update.sh --force
echo
echo "Done. Check: curl -s https://\$(grep ^APP_DOMAIN= .env | cut -d= -f2)/api/health"
