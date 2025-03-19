#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script verifies the connection to MongoDB
 * It can be run as part of Docker health checks
 */

// Get MongoDB URI from environment or use default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://xrpl:xrpl@localhost:27017/';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

async function checkMongoDB(retry = 0) {
  console.log(`Attempt ${retry + 1}/${MAX_RETRIES} - Testing MongoDB connection to: ${
    MONGO_URI.replace(/:[^:@]+@/, ':***@') // Hide password in logs
  }`);

  // Dynamically import the mongodb driver
  let MongoClient;
  try {
    ({ MongoClient } = await import('mongodb'));
  } catch (err) {
    console.error('Failed to import mongodb:', err);
    process.exit(1);
  }

  try {
    // Connect with a timeout
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    
    // Check server info
    const admin = client.db().admin();
    const serverInfo = await admin.serverInfo();
    
    console.log('✅ Successfully connected to MongoDB');
    console.log(`MongoDB version: ${serverInfo.version}`);
    
    // List databases
    const dbs = await admin.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name).join(', '));
    
    await client.close();
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection failed:`, error.message);
    
    if (retry < MAX_RETRIES - 1) {
      console.log(`Retrying in ${RETRY_DELAY_MS/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return checkMongoDB(retry + 1);
    } else {
      console.error('Maximum retry attempts reached. Exiting.');
      process.exit(1);
    }
  }
}

// Run the check
checkMongoDB()
  .then(() => {
    console.log('MongoDB health check completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 