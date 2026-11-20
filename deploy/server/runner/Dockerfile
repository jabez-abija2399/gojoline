# The sandbox runner (server.ts): Node plus the Docker command-line client. It talks to the host's
# Docker through the mounted socket and is reachable only on the private compose network.
FROM node:22-alpine
RUN apk add --no-cache docker-cli
WORKDIR /runner
COPY package.json lib.ts server.ts ./
ENV NODE_ENV=production
EXPOSE 7070
CMD ["node", "server.ts"]
