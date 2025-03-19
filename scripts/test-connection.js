const { MongoClient } = require('mongodb');

async function testConnection() {
  // Get MongoDB connection details from environment variables
  const uri = process.env.MONGO_URI || 'mongodb://xrpl:xrpl@xrpl-mongo:27017/';
  const dbName = process.env.MONGO_DB_NAME || 'xrpl_transactions';
  
  console.log('Testing connection with:');
  console.log(`URI: ${uri}`);
  console.log(`Database: ${dbName}`);
  
  try {
    // Create a new MongoClient
    const client = new MongoClient(uri);
    
    // Connect the client to the server
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // Check if we can list the databases
    const adminDb = client.db('admin');
    const listDatabases = await adminDb.admin().listDatabases();
    console.log('Available databases:');
    listDatabases.databases.forEach((db) => {
      console.log(`- ${db.name}`);
    });
    
    // Try to use the specific database
    const db = client.db(dbName);
    console.log(`Using database: ${dbName}`);
    
    // List collections in that database
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in ${dbName}`);
    
    // Show each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    // Close the connection
    await client.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

// Execute the test
testConnection(); 