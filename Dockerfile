# Stage 1: Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY app/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the application source code
COPY app /app

# Stage 2: Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependencies and application source code from the builder stage
COPY --from=builder /app /app

# Copy SSL certificate
COPY ca-certificate.crt /ssl/ca-certificate.crt

# Install OpenSSL for PostgreSQL SSL support
RUN apk add --no-cache openssl

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Command to run the application
CMD ["node", "db.js"]
