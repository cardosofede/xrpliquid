'use server';

import { MONGODB } from './config';

/**
 * MongoDB Utility Library
 * 
 * This file provides a general-purpose MongoDB connector for accessing and analyzing data.
 * It serves as the foundation for all MongoDB operations in the application.
 * 
 * Architecture:
 * - This file (db.ts): General MongoDB connector for basic operations
 * - Specialized clients (like xrplMongoClient.ts): Domain-specific implementations for particular data structures
 * - API endpoints use either this general connector or specialized clients based on their needs
 */

// Type definitions for MongoDB
type MongoClient = import('mongodb').MongoClient;
type MongoCollection = import('mongodb').Collection;
type MongoDatabase = import('mongodb').Db;
type Mongoose = typeof import('mongoose').default;

// Global caching variables - initialized only on server
let _mongoClientPromise: Promise<MongoClient> | null = null;
let _mongoosePromise: Promise<Mongoose> | null = null;

/**
 * Function to get a MongoDB client - safely handled on server
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (typeof window !== 'undefined') {
    throw new Error('getMongoClient should only be called on the server');
  }

  if (!_mongoClientPromise) {
    // Dynamic import is crucial - only loaded at runtime on server
    const mongodb = await import('mongodb');
    const client = new mongodb.MongoClient(MONGODB.URI);
    _mongoClientPromise = client.connect();
  }
  
  return _mongoClientPromise;
}

/**
 * Function to load Mongoose dynamically on server
 */
export async function getMongoose(): Promise<Mongoose> {
  if (typeof window !== 'undefined') {
    throw new Error('getMongoose should only be called on the server');
  }
  
  if (!_mongoosePromise) {
    // Dynamic import is crucial - only loaded at runtime on server
    const mongoose = await import('mongoose');
    _mongoosePromise = mongoose.default.connect(MONGODB.URI);
  }
  
  const mongoose = await import('mongoose');
  await _mongoosePromise;
  return mongoose.default;
}

/**
 * Get MongoDB database instance
 */
export async function getDatabase(): Promise<MongoDatabase> {
  const client = await getMongoClient();
  
  try {
    // First try the primary database name
    const primaryDb = client.db(MONGODB.DB_NAME);
    // Check if we can access a collection to verify the database exists
    await primaryDb.listCollections().toArray();
    console.log(`Successfully connected to primary database ${MONGODB.DB_NAME}`);
    return primaryDb;
  } catch (error) {
    console.warn(`Failed to connect to primary database ${MONGODB.DB_NAME}, trying fallbacks`);
    
    // Try each fallback database in sequence
    if (MONGODB.FALLBACK_DB_NAMES && MONGODB.FALLBACK_DB_NAMES.length > 0) {
      for (const fallbackName of MONGODB.FALLBACK_DB_NAMES) {
        try {
          const fallbackDb = client.db(fallbackName);
          // Verify we can access a collection
          await fallbackDb.listCollections().toArray();
          console.log(`Successfully connected to fallback database ${fallbackName}`);
          return fallbackDb;
        } catch (fallbackError) {
          console.warn(`Failed to connect to fallback database ${fallbackName}`);
        }
      }
    }
    
    // If all fallbacks fail, list all available databases
    try {
      const adminDb = client.db('admin');
      const dbs = await adminDb.admin().listDatabases();
      console.log('Available databases:', dbs.databases.map((db: any) => db.name).join(', '));
      
      // If databases exist, try to use the first one that's not admin/config/local
      const userDbs = dbs.databases.filter((db: any) => 
        !['admin', 'config', 'local'].includes(db.name)
      );
      
      if (userDbs.length > 0) {
        const firstUserDb = client.db(userDbs[0].name);
        console.log(`Attempting to use first available database: ${userDbs[0].name}`);
        await firstUserDb.listCollections().toArray();
        return firstUserDb;
      }
    } catch (listError) {
      console.error('Failed to list available databases:', listError);
    }
    
    // If all attempts fail, throw the original error
    throw error;
  }
}

/**
 * Get a specific MongoDB collection
 */
export async function getCollection(name: string): Promise<MongoCollection> {
  const db = await getDatabase();
  return db.collection(name);
}

/**
 * Get information about MongoDB collections and their structure
 * Migrated from mongodb.ts to centralize MongoDB access
 */
export async function getCollectionInfo() {
  const client = await getMongoClient();
  const db = client.db();
  const collections = await db.listCollections().toArray();
  
  const collectionsInfo = await Promise.all(
    collections.map(async (collection) => {
      const name = collection.name;
      const count = await db.collection(name).countDocuments();
      // Get sample documents to infer schema
      const sampleDocs = await db.collection(name).find().limit(5).toArray();
      
      return {
        name,
        count,
        sampleDocs
      }
    })
  );
  
  return collectionsInfo;
}

// Type for runQuery function parameters
type RunQueryParams = {
  collection: string;
  operation: 'find' | 'findOne' | 'count' | 'aggregate' | 'insertOne' | 'updateOne' | 'deleteOne';
  query?: any;
  sort?: any;
  limit?: number;
  skip?: number;
  project?: any;
  document?: any; // For insert operations
  update?: any;   // For update operations
};

// Run a database query with error handling
export async function runQuery(params: RunQueryParams) {
  try {
    console.log(`Executing ${params.operation} on ${params.collection} collection`);
    
    const db = await getDatabase();
    const collection = db.collection(params.collection);
    
    // Log collection info for debugging
    const collectionInfo = {
      name: params.collection,
      database: db.databaseName,
      operation: params.operation
    };
    console.log('Collection info:', collectionInfo);

    switch (params.operation) {
      case 'find': {
        let query = collection.find(params.query || {});
        
        if (params.sort) {
          query = query.sort(params.sort);
        }
        
        if (params.skip !== undefined) {
          query = query.skip(params.skip);
        }
        
        if (params.limit) {
          query = query.limit(params.limit);
        }
        
        if (params.project) {
          query = query.project(params.project);
        }
        
        const results = await query.toArray();
        console.log(`Found ${results.length} documents in ${params.collection}`);
        return results;
      }
      case 'findOne': {
        const result = await collection.findOne(params.query || {});
        console.log(`FindOne result: ${result ? 'Document found' : 'No document found'}`);
        return result;
      }
      case 'count': {
        const count = await collection.countDocuments(params.query || {});
        console.log(`Count result for ${params.collection}: ${count}`);
        return count;
      }
      case 'aggregate': {
        const results = await collection.aggregate(params.query || []).toArray();
        console.log(`Aggregation returned ${results.length} results`);
        return results;
      }
      case 'insertOne': {
        const result = await collection.insertOne(params.document || {});
        console.log(`Inserted document with ID: ${result.insertedId}`);
        return result;
      }
      case 'updateOne': {
        const result = await collection.updateOne(
          params.query || {}, 
          params.update || { $set: {} }
        );
        console.log(`Updated ${result.modifiedCount} document(s)`);
        return result;
      }
      case 'deleteOne': {
        const result = await collection.deleteOne(params.query || {});
        console.log(`Deleted ${result.deletedCount} document(s)`);
        return result;
      }
      default:
        throw new Error(`Unsupported operation: ${params.operation}`);
    }
  } catch (error) {
    console.error(`MongoDB query error (${params.collection}.${params.operation}):`, error);
    throw error;
  }
} 