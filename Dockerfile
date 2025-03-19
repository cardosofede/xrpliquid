# Use the Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy remaining files
COPY . .

# Set environment variables
ENV MONGO_URI=mongodb://xrpl:xrpl@host.docker.internal:27017/
ENV MONGO_DB_NAME=xrpl_transactions
ENV DOCKER_ENV=true
ENV NEXT_PUBLIC_API_URL=http://localhost:3000

# Make scripts executable
RUN chmod +x scripts/check-db.js

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 