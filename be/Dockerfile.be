# Backend Dockerfile - Express.js with TypeScript
FROM node:18-bullseye

WORKDIR /app/be

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for development)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code (if needed)
# RUN npm run build

# Expose port
EXPOSE 8000

# Start the application
# CMD ["sh", "-c", "npm install && npm start"]
