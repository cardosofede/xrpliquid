import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Define Transaction interface with more flexible typing
interface Transaction {
  created_date?: any;
  resolution_date?: any;
  close_time_iso?: string;
  createdAt?: any;
  trades?: Array<{
    timestamp?: any;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Helper function to get the date from a transaction object
function getTransactionDate(transaction: Transaction): Date {
  try {
    // MongoDB $date format check
    if (transaction.created_date && typeof transaction.created_date === 'object' && '$date' in transaction.created_date) {
      return new Date(transaction.created_date.$date);
    }
    
    if (transaction.resolution_date && typeof transaction.resolution_date === 'object' && '$date' in transaction.resolution_date) {
      return new Date(transaction.resolution_date.$date);
    }
    
    // Direct date fields
    if (transaction.created_date && (typeof transaction.created_date === 'string' || transaction.created_date instanceof Date)) {
      return new Date(transaction.created_date);
    }
    
    if (transaction.resolution_date && (typeof transaction.resolution_date === 'string' || transaction.resolution_date instanceof Date)) {
      return new Date(transaction.resolution_date);
    }
    
    // Trade timestamps
    if (transaction.trades && transaction.trades.length > 0) {
      const trade = transaction.trades[0];
      
      if (trade.timestamp && typeof trade.timestamp === 'object' && '$date' in trade.timestamp) {
        return new Date(trade.timestamp.$date);
      }
      
      if (trade.timestamp && (typeof trade.timestamp === 'string' || trade.timestamp instanceof Date)) {
        return new Date(trade.timestamp);
      }
    }
    
    // Standard XRPL fields
    if (transaction.close_time_iso && typeof transaction.close_time_iso === 'string') {
      return new Date(transaction.close_time_iso);
    }
    
    // Next.js/Mongoose fields
    if (transaction.createdAt && (typeof transaction.createdAt === 'string' || transaction.createdAt instanceof Date)) {
      return new Date(transaction.createdAt);
    }
    
    // Log all keys in the transaction for debugging
    console.warn('No valid date field found in transaction. Available keys:', Object.keys(transaction).join(', '));
    
    // Default to current date if no date field found
    return new Date();
  } catch (error) {
    console.error('Error parsing transaction date:', error);
    return new Date();
  }
}

// Handler for GET requests
export async function GET() {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    console.log('Fetching transaction date range...')
    console.log('MongoDB configuration:', {
      URI: MONGODB.URI,
      DB_NAME: MONGODB.DB_NAME,
      DEFAULT_LIMIT: MONGODB.DEFAULT_LIMIT
    })
    
    // Import the db module here to ensure it's only loaded on the server
    const { runQuery } = await import('@/lib/db')
    
    // Get transaction count directly
    const transactionCount = await runQuery({
      collection: 'transactions',
      operation: 'count'
    })
    console.log(`Total transaction count: ${transactionCount}`)
    
    // Get transactions for date range analysis using the server-safe db utility
    // Get oldest transactions (for min date)
    const oldestTransactions = await runQuery({
      collection: 'transactions',
      operation: 'find',
      limit: 10,
      sort: { 'created_date': 1 }
    }) as Transaction[];
    
    // Get newest transactions (for max date)
    const newestTransactions = await runQuery({
      collection: 'transactions',
      operation: 'find',
      limit: 10,
      sort: { 'created_date': -1 }
    }) as Transaction[];
    
    console.log(`Retrieved ${oldestTransactions.length} oldest and ${newestTransactions.length} newest transactions for date analysis`);
    
    // Combine transactions for processing
    const transactions = [...oldestTransactions, ...newestTransactions];
    
    // Find min and max dates in the transactions
    let minDate = new Date()
    let maxDate = new Date()
    
    if (transactions.length > 0) {
      // Map transactions to their dates and log detailed info about each transaction's dates
      console.log('First few transactions date fields:');
      const dateFields = transactions.slice(0, 3).map(t => ({
        id: t._id || t.hash || 'Unknown ID',
        created_date: t.created_date,
        resolution_date: t.resolution_date,
        trade_timestamp: t.trades?.[0]?.timestamp,
        extracted_date: getTransactionDate(t).toISOString()
      }));
      console.log(JSON.stringify(dateFields, null, 2));
      
      // Map transactions to their dates and sort
      const transactionDates = transactions.map((transaction: Transaction) => getTransactionDate(transaction));
      
      // Sort dates for min and max
      const sortedDates = [...transactionDates].sort((a, b) => a.getTime() - b.getTime());
      minDate = sortedDates[0];
      maxDate = sortedDates[sortedDates.length - 1];
      
      console.log(`Date range: ${minDate.toISOString()} - ${maxDate.toISOString()}`);
      console.log('Min date from:', transactions.find(t => 
        getTransactionDate(t).getTime() === minDate.getTime()
      )?.hash || 'Unknown');
      console.log('Max date from:', transactions.find(t => 
        getTransactionDate(t).getTime() === maxDate.getTime()
      )?.hash || 'Unknown');
    } else {
      console.log('No transactions found, using current date')
    }
    
    return NextResponse.json({ 
      success: true, 
      minDate: minDate.toISOString(), 
      maxDate: maxDate.toISOString(),
      transactionCount
    })
  } catch (error) {
    console.error('Error fetching transaction date range:', error)
    // Include more details for Docker debugging
    console.error('Environment:', {
      MONGO_URI: process.env.MONGO_URI,
      MONGO_DB_NAME: process.env.MONGO_DB_NAME,
      NODE_ENV: process.env.NODE_ENV
    })
    
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch transaction date range: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
} 