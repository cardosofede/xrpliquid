'use server';

import { MONGODB } from '@/lib/config';

/**
 * Initialize the database connection
 * This is a helper function to ensure MongoDB is properly connected
 * and ready to use in API routes
 */
export async function initializeMongoDB() {
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
    // MongoDB client
    const { getMongoClient } = await import('@/lib/db');
    
    // Connect to the database
    const client = await getMongoClient();
    console.log('MongoDB initialized and connected');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
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
    await initializeMongoDB();
    
    // Call the original handler
    return handler(...args);
  };
} 