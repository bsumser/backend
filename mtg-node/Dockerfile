# Stage 1: Build stage
FROM node:18-alpine as builder

WORKDIR /mtg-node

# Copy the app's package.json and its own package-lock.json
COPY mtg-node/package.json ./package.json
# Ensures we use the lock file corresponding to the app's package.json
COPY mtg-node/package-lock.json ./package-lock.json 

# Install only production dependencies based on the app's package files
RUN npm install --production

# Copy full application code from the app directory into /app in the builder
# This ensures server.js, app.js, etc., are present alongside node_modules
COPY mtg-node/ .

# Stage 2: Final image
FROM node:18-alpine

WORKDIR /mtg-node

# Copy the entire built application (code + node_modules) from the builder stage
COPY --from=builder /mtg-node /mtg-node

# Handle CA certificate
# The original Dockerfile copied ca-certificate.crt from the project root to /ssl/ca-certificate.crt.
# Your app/ directory also contains a ca-certificate.crt, which will be copied to /app/ca-certificate.crt
# by the COPY --from=builder /app /app line.
# You need to ensure your application is configured to use the correct certificate.
# If it's supposed to use the one from the project root, placed in /ssl/:
COPY ca-certificate.crt /ssl/ca-certificate.crt
# If your app reads it from its own directory (e.g., /app/ca-certificate.crt), that's already handled.

RUN apk add --no-cache openssl

EXPOSE 8081

ENV NODE_ENV=production
ENV PORT=8081

CMD ["node", "server.js"]
