# Use the official Playwright image — it includes Node and all Chromium deps
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app

# Copy package files and install Node deps
COPY package*.json ./
# Use `npm install` in the build image. Some CI/build environments
# don't provide a lockfile; `npm ci` fails when package-lock.json is
# missing. `npm install --production` is more robust for Docker builds
# where we only need runtime dependencies.
RUN npm install --production --no-audit --no-fund

# Install Playwright browsers (only Chromium needed)
RUN npx playwright install chromium --with-deps

# Copy the rest of the project (booking.js, server.js, signature.png, etc.)
COPY . .

# Railway injects PORT at runtime; expose it for documentation
EXPOSE 3000

# Start the HTTP server (not booking.js directly)
CMD ["node", "server.js"]
