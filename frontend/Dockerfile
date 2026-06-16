# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/serve.json ./dist/serve.json

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000", "-c", "serve.json", "--no-etag"]
