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
    
    // Dynamic imports to ensure client-side compatibility
    // MongoDB client
    const { getMongoClient } = await import('@/lib/db');
    
    // Connect to the database
    const client = await getMongoClient();
    console.log('MongoDB initialized and connected');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Wrap an API handler with MongoDB initialization
 */
export function withMongoDB(handler: Function) {
  return async function(...args: any[]) {
    // Initialize MongoDB
    await initializeMongoDB();
    
    // Call the original handler
    return handler(...args);
  };
} 