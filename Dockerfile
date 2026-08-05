# Build stage
FROM node:24-alpine AS build

# Build arguments with defaults
ARG TAG_NAME
ARG BUILD_VERSION
# Site URL for meta tags and canonical URLs
ARG VITE_SITE_URL=http://localhost:8080
# CDN image URL for meta tags (OG images, etc.)
ARG VITE_CDN_IMAGE_URL=
# CDN base URL for JS/CSS assets (for production builds with CDN)
ARG CDN_URL=
# Separate CDN for images (optional, defaults to CDN_URL)
ARG CDN_IMAGE_URL=

# Convert ARGs to ENVs so they're available in RUN commands
ENV TAG_NAME=${TAG_NAME}
ENV BUILD_VERSION=${BUILD_VERSION}
ENV VITE_SITE_URL=${VITE_SITE_URL}
ENV VITE_CDN_IMAGE_URL=${VITE_CDN_IMAGE_URL}
ENV CDN_URL=${CDN_URL}
ENV CDN_IMAGE_URL=${CDN_IMAGE_URL}

# Set working directory
WORKDIR /app

# Copy package.json files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies with cache optimization
RUN corepack enable && \
    corepack prepare pnpm@10.8.0 --activate && \
    pnpm install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the app
# If CDN_URL is provided, use CDN build with asset optimization (production)
# Otherwise use standard build with placeholders for runtime replacement (community)
RUN if [ -n "$CDN_URL" ]; then \
    echo "🚀 Building with CDN support..."; \
    echo "VITE_SITE_URL=${VITE_SITE_URL}" > .env; \
    echo "VITE_CDN_IMAGE_URL=${VITE_CDN_IMAGE_URL:-$VITE_SITE_URL}" >> .env; \
    echo "CDN_URL=${CDN_URL}" >> .env; \
    echo "CDN_IMAGE_URL=${CDN_IMAGE_URL:-$CDN_URL}" >> .env; \
    pnpm build:cdn; \
    else \
    echo "🚀 Building community version (runtime replacement)..."; \
    echo "VITE_SITE_URL=__USE_CURRENT_ORIGIN__" > .env; \
    echo "KEEP_PLACEHOLDERS=true" >> .env; \
    pnpm build; \
    fi

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy the built files to Nginx serve directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use the entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
