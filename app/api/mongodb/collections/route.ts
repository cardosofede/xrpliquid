import { NextResponse } from 'next/server';
import { MONGODB } from '@/lib/config';
import { CollectionInfo } from 'mongodb';
import { initializeMongoDB } from '@/app/api/_serverUtils';

// Interface for MongoDB collection
interface MongoCollection {
  name: string;
  type: string;
  options?: any;
  info?: any;
}

export async function GET() {
  try {
    console.log('MongoDB collections endpoint using db.ts');
    console.log(`Using database: ${MONGODB.DB_NAME}`);
    
    // Initialize MongoDB first
    await initializeMongoDB();
    
    // Import getCollectionInfo from db.ts
    const { getDatabase } = await import('@/lib/db');
    
    // Get the database
    const db = await getDatabase();
    
    // List collections in that database
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in ${db.databaseName}`);
    
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