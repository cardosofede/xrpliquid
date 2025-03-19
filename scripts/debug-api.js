const { MongoClient } = require('mongodb');

async function debugApiCall() {
  try {
    // Same logic used in your API endpoint
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://xrpl:xrpl@xrpl-mongo:27017/';
    const DB_NAME = process.env.MONGO_DB_NAME || 'xrpl_transactions';
    
    console.log(`MONGO_URI: ${MONGO_URI}`);
    console.log(`DB_NAME: ${DB_NAME}`);
    
    // Connect to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = client.db(DB_NAME);
    
    // Get collections with the exact same code used in your API
    console.log('\nTrying to list collections...');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    // For each collection, get the count of documents (just like your API)
    console.log('\nTrying to get document counts for each collection...');
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const count = await db.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          count,
          info: collection,
        };
      })
    );
    
    // Output the final result that would be returned by your API
    console.log('\nAPI Result:');
    console.log(JSON.stringify({
      status: 'success',
      collections: collectionsWithCounts,
    }, null, 2));
    
    // Close the connection
    await client.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error in debug:', error);
  }
}

// Run the debug function
debugApiCall(); 