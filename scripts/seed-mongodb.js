require('dotenv').config();
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/xrpliquid';

// Generate random dates within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate sample transaction data
function generateTransactions(count) {
  const startDate = new Date(2023, 0, 1); // Jan 1, 2023
  const endDate = new Date(); // Current date
  
  const assets = ['XRP/RLUSD', 'BTC/RLUSD', 'ETH/RLUSD', 'SOL/RLUSD', 'XLM/RLUSD'];
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const date = randomDate(startDate, endDate);
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const amount = parseFloat((Math.random() * 10000 + 100).toFixed(2));
    const type = Math.random() > 0.5 ? 'Buy' : 'Sell';
    const userId = `User_${1000 + Math.floor(Math.random() * 50)}`;
    
    transactions.push({
      transactionId: `TX-${Math.floor(Math.random() * 1000000)}`,
      userId,
      asset,
      amount,
      type,
      date,
      status: 'Completed',
      walletId: `Wallet_${Math.floor(Math.random() * 1000)}`,
    });
  }
  
  return transactions;
}

async function seedDatabase() {
  let client;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Drop existing transactions collection if it exists
    try {
      await db.collection('transactions').drop();
      console.log('Dropped existing transactions collection');
    } catch (err) {
      // Collection might not exist yet
      console.log('No existing transactions collection to drop');
    }
    
    // Generate and insert sample transactions
    const transactions = generateTransactions(1000);
    const result = await db.collection('transactions').insertMany(transactions);
    
    console.log(`Successfully inserted ${result.insertedCount} transactions`);
    
    // Get the date range to verify
    const minDate = await db.collection('transactions').find().sort({ date: 1 }).limit(1).toArray();
    const maxDate = await db.collection('transactions').find().sort({ date: -1 }).limit(1).toArray();
    
    console.log('Transaction date range:');
    console.log(`  Min date: ${minDate[0].date.toISOString().split('T')[0]}`);
    console.log(`  Max date: ${maxDate[0].date.toISOString().split('T')[0]}`);
    
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the seeding function
seedDatabase(); 