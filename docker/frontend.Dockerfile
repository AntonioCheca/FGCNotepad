FROM node:24

# Keep Chromium's shared libraries in the image. The browser binary itself is
# installed into the Compose-managed volume after frontend dependencies exist.
COPY frontend/package*.json /tmp/playwright-deps/
RUN cd /tmp/playwright-deps \
    && npm ci --ignore-scripts \
    && npx playwright install-deps chromium \
    && rm -rf /tmp/playwright-deps

WORKDIR /app

# Don't install dependencies during build
# Don't copy source code during build

EXPOSE 3000

# Just keep the container running
CMD ["tail", "-f", "/dev/null"]
