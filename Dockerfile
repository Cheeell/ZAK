FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ src/
COPY webapp/ webapp/
COPY scripts/ scripts/

# Data directory for SQLite (will be mounted as persistent disk)
RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "src/index.js"]
