// MongoDB Health Check Script for Docker environments
require('dotenv').config();

// Get MongoDB connection details from environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb://xrpl:xrpl@xrpl-mongo:27017/';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'xrpl_transactions';
const isDocker = process.env.DOCKER_ENV === 'true';

// Use localhost if not in Docker environment
const resolvedUri = isDocker 
  ? MONGO_URI 
  : MONGO_URI.replace('xrpl-mongo', 'localhost');

async function checkMongoDB() {
  console.log('MongoDB Health Check:');
  console.log('-----------------');
  console.log(`Connection URI: ${resolvedUri.replace(/(mongodb:\/\/)([^@]+)@/, '$1****:****@')}`); // Hide credentials in logs
  console.log(`Database Name: ${MONGO_DB_NAME}`);
  console.log(`Docker Environment: ${isDocker ? 'Yes' : 'No'}`);
  console.log('-----------------');
  
  let client;
  let MongoClient;
  
  try {
    // Dynamically import MongoDB to avoid bundling issues
    console.log('Loading MongoDB client dynamically...');
    const mongodb = await import('mongodb');
    MongoClient = mongodb.MongoClient;
    
    console.log('Attempting to connect to MongoDB...');
    client = new MongoClient(resolvedUri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB server');
    
    // Check database access
    const db = client.db(MONGO_DB_NAME);
    console.log(`Attempting to access database "${MONGO_DB_NAME}"...`);
    const collections = await db.listCollections().toArray();
    console.log(`✅ Successfully accessed database. Found ${collections.length} collections.`);
    
    // List collections
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check document counts in each collection
    console.log('\nDocument counts:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    console.log('\n✅ MongoDB connection is healthy');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('\nDebugging information:');
    console.error('- Make sure MongoDB is running');
    console.error('- Check if your Docker container can reach the MongoDB host');
    console.error('- Verify that the connection string is correct');
    console.error('- Ensure MongoDB authentication is configured correctly if used');
    
    // Network diagnostic info
    console.log('\nEnvironment details:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Current working directory:', process.cwd());
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute the health check
checkMongoDB(); 