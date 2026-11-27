# The video renderer (server.ts): Node, the system Chromium (driven by playwright-core), ffmpeg,
# and Noto fonts for Ethiopic text. Reachable only on the private compose network.
FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ffmpeg fonts-inter fonts-noto-core fonts-noto-color-emoji ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /renderer
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY lib.ts server.ts logo.svg logo-am.svg music.m4a ./
COPY fonts ./fonts
ENV NODE_ENV=production CHROMIUM_PATH=/usr/bin/chromium
USER node
EXPOSE 7071
# Low priority, inherited by Chromium and ffmpeg: the app and site builds share this server.
CMD ["nice", "-n", "10", "node", "server.ts"]
