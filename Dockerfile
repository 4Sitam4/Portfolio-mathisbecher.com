# ---- Build stage -----------------------------------------------------------
# Base images pinned by digest (multi-arch index); Dependabot bumps them.
FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS build
WORKDIR /app

# Headless Chromium prints the CV to PDF and renders the link-preview image
# after the Astro build (scripts/render-assets.mjs). Build stage only: none
# of it reaches the final image.
RUN apk add --no-cache chromium font-dejavu
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV RENDER_REQUIRED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
 && find dist -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.svg' -o -name '*.xml' -o -name '*.txt' \) \
      -exec gzip -9 -k -n {} +

# ---- Runtime stage ----------------------------------------------------------
# Unprivileged nginx: the server runs as the "nginx" user (uid 101), never as
# root, and listens on 8080. Only the built static site and the nginx config
# end up in the final image.
FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03

# Pull the latest security fixes of the Alpine base packages.
USER root
RUN apk upgrade --no-cache
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# 127.0.0.1 explicite : busybox wget résout localhost en ::1 en premier
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
