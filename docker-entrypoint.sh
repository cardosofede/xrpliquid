#!/bin/bash
set -e

# Function to check if MongoDB is ready
check_mongodb() {
  echo "Checking MongoDB connectivity..."
  node /app/scripts/check-mongodb.js
  if [ $? -ne 0 ]; then
    echo "⚠️ MongoDB connectivity check failed. Sleeping for 5 seconds before retrying..."
    sleep 5
    return 1
  fi
  return 0
}

# Make sure the .env.local file exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local file..."
  cat <<EOT > .env.local
# MongoDB connection
MONGODB_URI=mongodb://xrpl:xrpl@xrpl-mongo:27017/
MONGO_URI=mongodb://xrpl:xrpl@xrpl-mongo:27017/
MONGO_DB_NAME=xrpl_transactions
DOCKER_ENV=true

# API URL for client-side fetching
NEXT_PUBLIC_API_URL=http://localhost:3000
EOT
fi

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
until check_mongodb; do
  echo "Retrying MongoDB connectivity check..."
done

echo "✅ MongoDB is ready!"

# Set NODE_OPTIONS to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Execute the provided command (likely npm start)
exec "$@" 