#!/usr/bin/env node

/**
 * This script helps inspect your MongoDB collections and export their structure
 * to a JSON file that can be used by Cursor for MPC integration.
 */

// Import required modules
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection string from environment variable or default to localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-dashboard';

async function main() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    // Get the database name from the connection string
    const dbName = MONGODB_URI.split('/').pop();
    const db = client.db(dbName);
    
    // Get list of collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    const collectionsInfo = [];
    
    // Process each collection
    for (const collection of collections) {
      const name = collection.name;
      const count = await db.collection(name).countDocuments();
      
      console.log(`Analyzing collection: ${name} (${count} documents)`);
      
      // Get a sample document to understand the schema
      const sample = await db.collection(name).find().limit(5).toArray();
      
      // Extract schema information from sample documents
      const schema = {};
      if (sample.length > 0) {
        // Combine field names from all sample documents
        sample.forEach(doc => {
          Object.keys(doc).forEach(field => {
            const value = doc[field];
            const type = Array.isArray(value) ? 'array' : typeof value;
            
            // For ObjectId fields, mark them as such
            if (value && value._bsontype === 'ObjectID') {
              schema[field] = { type: 'ObjectId', ref: 'unknown' };
            } else if (value instanceof Date) {
              schema[field] = { type: 'Date' };
            } else {
              schema[field] = { type };
            }
          });
        });
      }
      
      collectionsInfo.push({
        name,
        count,
        schema,
        sample: sample.length > 0 ? sample[0] : null
      });
    }
    
    // Save the collection information to a file
    const outputPath = path.join(process.cwd(), 'mongo-collections.json');
    fs.writeFileSync(outputPath, JSON.stringify(collectionsInfo, null, 2));
    
    console.log(`MongoDB collection information saved to ${outputPath}`);
    console.log('You can now use this file with Cursor MPC for better collection structure awareness');
    
  } catch (err) {
    console.error('Error inspecting MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error); 