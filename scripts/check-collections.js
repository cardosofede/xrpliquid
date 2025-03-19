const { MongoClient } = require('mongodb');

async function checkCollections() {
  // Get MongoDB connection details from environment variables
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://xrpl:xrpl@xrpl-mongo:27017/';
  const DB_NAME = process.env.MONGO_DB_NAME || 'xrpl_transactions';
  
  console.log(`Checking MongoDB connection to: ${MONGO_URI}`);
  console.log(`Database name: ${DB_NAME}`);
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    // List all databases to verify database name
    const databases = await client.db().admin().listDatabases();
    console.log('\nAvailable databases:');
    databases.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    // Connect to the specific database
    const db = client.db(DB_NAME);
    
    // List all collections in that database
    const collections = await db.listCollections().toArray();
    console.log(`\nCollections in database '${DB_NAME}':`);
    if (collections.length === 0) {
      console.log('No collections found in this database.');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`- ${collection.name}: ${count} documents`);
      }
    }
    
    // Close the connection
    await client.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
checkCollections(); 