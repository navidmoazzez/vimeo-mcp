# Self-hosting the HTTP transport.
#
# Only useful for the --http mode. An MCP client running locally launches the
# server over stdio and needs no container.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Binds all interfaces inside the container. Publish the port deliberately, and
# set VIMEO_HTTP_TOKEN: anything that reaches this port can use the Vimeo token.
ENV VIMEO_HTTP_HOST=0.0.0.0
ENV VIMEO_HTTP_PORT=8787
EXPOSE 8787

# Runs unprivileged. The image needs no write access to anything.
USER node
CMD ["node", "dist/index.js", "--http"]
