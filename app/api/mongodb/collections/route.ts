import { NextResponse } from 'next/server';
import { MONGODB } from '@/lib/config';
import { CollectionInfo } from 'mongodb';

// Interface for MongoDB collection
interface MongoCollection {
  name: string;
  type: string;
  options?: any;
  info?: any;
}

export async function GET() {
  try {
    console.log('Direct MongoDB connection for collections endpoint');
    console.log(`Using database: ${MONGODB.DB_NAME}`);
    
    // Dynamic import the MongoDB client
    const { MongoClient } = await import('mongodb');
    
    // Connect directly to MongoDB
    const client = new MongoClient(MONGODB.URI);
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // Get the specific database
    const db = client.db(MONGODB.DB_NAME);
    
    // List collections in that database
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in ${MONGODB.DB_NAME}`);
    
    // For each collection, get the count of documents
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`Collection ${collection.name}: ${count} documents`);
        return {
          name: collection.name,
          count,
          info: collection,
        };
      })
    );
    
    // Close the connection
    await client.close();
    
    return NextResponse.json({
      status: 'success',
      collections: collectionsWithCounts,
    });
  } catch (error) {
    console.error('Failed to fetch MongoDB collections:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 