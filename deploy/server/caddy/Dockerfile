# Caddy for deploy/server: the official image, or (CADDY_FLAVOR=plain-dns, chosen by compose when
# CLOUDFLARE_DNS_API_TOKEN is set) the same Caddy built with the Cloudflare DNS module, so customer
# sites can use one wildcard certificate (DNS-01) instead of one certificate each.
# BuildKit builds only the stage that is used.
ARG CADDY_FLAVOR=plain

FROM caddy:2-builder AS dns-build
RUN xcaddy build --with github.com/caddy-dns/cloudflare

FROM caddy:2 AS plain-dns
COPY --from=dns-build /usr/bin/caddy /usr/bin/caddy

FROM caddy:2 AS plain

FROM ${CADDY_FLAVOR}
# The site TLS choices the Caddyfile imports (tls.caddy: on demand; tls-wildcard.caddy: DNS-01).
COPY tls.caddy tls-wildcard.caddy /etc/caddy/sites-tls/
