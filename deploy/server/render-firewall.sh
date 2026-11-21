#!/usr/bin/env bash
# The video renderer's network (172.30.250.0/24, compose.yml) may reach the internet, never
# private addresses: cloud metadata, the Docker host, other containers, the AWS network.
# Idempotent; run at boot after Docker (gojoline-render-firewall.service) and by setup.sh.
set -euo pipefail
NET=172.30.250.0/24
iptables -N GOJO-RENDER 2>/dev/null || iptables -F GOJO-RENDER
# Within its own network (the app asking, the renderer answering).
iptables -A GOJO-RENDER -d "$NET" -j RETURN
for d in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 169.254.0.0/16 100.64.0.0/10 127.0.0.0/8 0.0.0.0/8; do
  iptables -A GOJO-RENDER -d "$d" -j DROP
done
iptables -A GOJO-RENDER -j RETURN
# DOCKER-USER exists once Docker has started.
iptables -C DOCKER-USER -s "$NET" -j GOJO-RENDER 2>/dev/null || iptables -I DOCKER-USER -s "$NET" -j GOJO-RENDER
echo "renderer firewall in place"
