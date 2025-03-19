# Docker Setup for XRPLiquid

This document provides instructions for rebuilding and running the XRPLiquid application in Docker.

## Prerequisites

- Docker and Docker Compose installed
- MongoDB running in a container or accessible from your Docker network

## Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```
# MongoDB connection
MONGODB_URI=mongodb://mongodb:27017/xrpliquid
MONGO_URI=mongodb://mongodb:27017/
MONGO_DB_NAME=xrpl_transactions

# API URL for client-side fetching
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The `mongodb` hostname should match the service name in your Docker Compose file or the hostname where MongoDB is accessible.

## Rebuilding the Docker Image

```bash
# Rename Dockerfile.update to Dockerfile
mv Dockerfile.update Dockerfile

# Build the Docker image
docker build -t xrpliquid:latest .
```

## Running the Application

### Option 1: Using Docker Run

```bash
docker run -p 3000:3000 --env-file .env.local --network <your-mongodb-network> xrpliquid:latest
```

Replace `<your-mongodb-network>` with the Docker network where your MongoDB container is running.

### Option 2: Using Docker Compose

Create or update your `docker-compose.yml` file:

```yaml
version: '3'
services:
  app:
    image: xrpliquid:latest
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

Then run:

```bash
docker compose up
```

## Checking MongoDB Connectivity

You can check the MongoDB connectivity from within the container:

```bash
docker exec -it <container-id> npm run check-mongodb
```

## Seeding MongoDB with Sample Data

To seed MongoDB with sample data:

```bash
docker exec -it <container-id> npm run seed-mongodb
```

## Troubleshooting

If you encounter issues with MongoDB connectivity:

1. Make sure MongoDB is running and accessible from the container network
2. Check that the MongoDB hostname in `.env.local` matches the service name in Docker Compose
3. Run the MongoDB health check script to diagnose connectivity issues
4. Check the container logs for more detailed error messages 