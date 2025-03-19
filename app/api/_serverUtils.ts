'use server';

import { MONGODB } from '@/lib/config';
import type { MongoClient } from 'mongodb';

/**
 * Initialize the database connection
 * This is a helper function to ensure MongoDB is properly connected
 * and ready to use in API routes
 */
export async function initializeMongoDB(retryCount = 3) {
  try {
    console.log('Initializing MongoDB connection...');
    console.log('MongoDB config being used:', {
      URI: MONGODB.URI,
      DB_NAME: MONGODB.DB_NAME,
      ENV_MONGO_URI: process.env.MONGO_URI,
      NODE_ENV: process.env.NODE_ENV,
      DOCKER_ENV: process.env.DOCKER_ENV
    });
    
    // Dynamic imports to ensure client-side compatibility
    const { getMongoClient } = await import('@/lib/db');
    
    // Try to connect with retry mechanism
    let lastError = null;
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Connect to the database with timeout
        const connectionPromise = getMongoClient();
        const client = await Promise.race([
          connectionPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('MongoDB connection timeout after 5 seconds')), 5000)
          )
        ]) as MongoClient;
        
        // Test the connection by running a simple command
        await client.db().command({ ping: 1 });
        
        console.log('MongoDB initialized and connected successfully');
        return { success: true };
      } catch (error) {
        lastError = error;
        console.warn(`MongoDB connection attempt ${attempt}/${retryCount} failed:`, error instanceof Error ? error.message : error);
        
        if (attempt < retryCount) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(100 * Math.pow(2, attempt), 2000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all retry attempts failed
    console.error('Failed to initialize MongoDB after all retry attempts:', lastError);
    console.error('Environment:', {
      MONGO_URI: process.env.MONGO_URI,
      MONGO_DB_NAME: process.env.MONGO_DB_NAME,
      NODE_ENV: process.env.NODE_ENV,
      DOCKER_ENV: process.env.DOCKER_ENV
    });
    
    return { 
      success: false, 
      error: lastError instanceof Error ? lastError.message : 'Unknown error after multiple retry attempts'
    };
  } catch (error) {
    console.error('Unexpected error during MongoDB initialization:', error);
    console.error('Environment:', {
      MONGO_URI: process.env.MONGO_URI,
      MONGO_DB_NAME: process.env.MONGO_DB_NAME,
      NODE_ENV: process.env.NODE_ENV,
      DOCKER_ENV: process.env.DOCKER_ENV
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Wrap an API handler with MongoDB initialization
 */
export async function withMongoDB(handler: Function) {
  return async function(...args: any[]) {
    // Initialize MongoDB
    const initResult = await initializeMongoDB();
    if (!initResult.success) {
      throw new Error(`MongoDB initialization failed: ${initResult.error}`);
    }
    
    // Call the original handler
    return handler(...args);
  };
} 