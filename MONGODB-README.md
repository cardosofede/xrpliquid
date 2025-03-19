# MongoDB with Next.js in Docker

This document explains how to fix the "Module not found: Can't resolve 'mongodb'" error when using MongoDB with Next.js in a Docker environment.

## The Problem

Next.js attempts to bundle MongoDB in client-side code, which causes build errors because MongoDB is a server-only package.

Common error:
```
Module not found: Can't resolve 'mongodb'
```

## The Solution

We've implemented several changes to ensure MongoDB works correctly with Next.js:

### 1. Next.js Configuration

We've created a `next.config.js` file that:
- Marks MongoDB as a server component package
- Prevents MongoDB from being bundled in client-side code

### 2. Dynamic Imports

We've created a new `lib/db.ts` utility that:
- Uses dynamic imports for MongoDB
- Provides a simple interface for database operations
- Ensures MongoDB is only loaded on the server

### 3. API Routes

We've updated all API routes to:
- Use the new dynamic import pattern
- Properly handle MongoDB connections
- Add better error handling for Docker environments

### 4. Environment Configuration

We've centralized all environment configuration in:
- A single `lib/config.ts` file
- Using Docker-friendly MongoDB hostnames

## How to Use

### Running in Development

```bash
# Test MongoDB connectivity
npm run test-mongodb

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the Next.js application
npm run build

# Start the production server
npm run start
```

### Docker Setup

```bash
# Build the Docker image
docker build -t xrpliquid:latest .

# Run the container
docker run -p 3000:3000 --env-file .env.local --network <your-mongodb-network> xrpliquid:latest
```

## Debugging

If you encounter issues:

1. Check MongoDB connectivity:
   ```bash
   npm run check-mongodb
   ```

2. Test MongoDB imports:
   ```bash
   npm run test-mongodb
   ```

3. Check environment variables:
   ```bash
   cat .env.local
   ```

4. Look for error logs in the console

## Further Reading

- [Next.js with MongoDB documentation](https://nextjs.org/docs/basic-features/data-fetching/client-side#using-mongodb-directly)
- [Docker networking guide](https://docs.docker.com/network/)
- [MongoDB Node.js Driver documentation](https://mongodb.github.io/node-mongodb-native/) 