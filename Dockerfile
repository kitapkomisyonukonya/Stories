FROM node:22-alpine AS app-build
WORKDIR /app
COPY package*.json ./
# Cloud Build has intermittently omitted Vite config dev dependencies even with --include=dev.
# Install from the lockfile first, then explicitly guarantee the two packages imported by vite.config.ts.
RUN npm ci --include=dev \
  && npm install --no-save --package-lock=false @vitejs/plugin-react@5.2.0 @tailwindcss/vite@4.1.14
# The sources are read through a mount instead of COPY . . so a local public/pdfs/books (the book PDFs
# live on Cloudflare R2) never enters the image.
RUN --mount=type=bind,target=/ctx \
  tar -C /ctx --exclude=./public/pdfs/books --exclude=./node_modules -cf - . | tar -xf - \
  && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The server makes small WebP copies of the Storage pictures (deploy/server.mjs, /media-image).
RUN npm install --no-save --no-package-lock --omit=dev sharp@0.34.5
COPY --from=app-build /app/dist ./dist
COPY deploy/server.mjs deploy/panelApi.mjs deploy/openBadges.mjs ./
COPY deploy/panel ./panel
EXPOSE 8080
CMD ["node", "server.mjs"]
