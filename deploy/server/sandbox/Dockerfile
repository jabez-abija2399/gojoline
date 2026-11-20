# One customer site's workspace: the site template with its packages installed, running the live
# preview (Vite) as a non-root user. Built from templates/site by update.sh (context = templates/site).
# The app's runner (deploy/server/runner) starts one container per project from this image, with
# no internet, capped memory/CPU, and only the AI-editable files changing (site.json, styles, photos).
FROM node:22-bookworm-slim
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1 npm_config_update_notifier=false
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && npm cache clean --force
COPY . .
RUN chown -R node:node /site
USER node
EXPOSE 5173
CMD ["node", "node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
