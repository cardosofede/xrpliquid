import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Processed transaction interface for the frontend
interface ProcessedTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal";
  amount: string;
  currency: string;
  fee: string;
  fromAddress: string;
  toAddress: string;
  timestamp: string;
  hash: string;
  ledgerIndex: number;
  rawData: any;
}

// Format a transaction for the frontend
function processTransaction(transaction: any): ProcessedTransaction {
  return {
    id: transaction._id?.toString() || transaction.hash || "Unknown",
    userId: transaction.user_id || "Unknown",
    type: transaction.type || "Unknown",
    amount: transaction.amount?.value?.toString() || "0",
    currency: transaction.amount?.currency || "XRP",
    fee: transaction.fee_xrp?.toString() || "0",
    fromAddress: transaction.from_address || "Unknown",
    toAddress: transaction.to_address || "Unknown",
    timestamp: transaction.timestamp ? new Date(transaction.timestamp).toISOString() : new Date().toISOString(),
    hash: transaction.hash || "Unknown",
    ledgerIndex: transaction.ledger_index || 0,
    rawData: transaction
  };
}

// Handler for GET requests
export async function GET(request: Request) {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    console.log('Fetching deposits and withdrawals...')
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // deposit, withdrawal, or undefined for both
    const currency = searchParams.get('currency');
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || String(MONGODB.DEFAULT_LIMIT), 10)
    const skip = (page - 1) * limit
    
    console.log('Deposits/withdrawals request params:', { userId, type, currency, page, limit });
    
    // Import the db module
    const { runQuery } = await import('@/lib/db')
    
    // Base query - filter by user ID if provided
    let query: any = userId ? { user_id: userId } : {};
    
    // Add type filter if specified
    if (type) {
      query.type = type.toLowerCase();
    }
    
    // Add currency filter if specified
    if (currency) {
      query["amount.currency"] = currency;
    }
    
    // Log the query for debugging
    console.log('MongoDB query:', query);
    
    // Fetch transactions
    const transactions = await runQuery({
      collection: 'deposits_withdrawals',
      operation: 'find',
      query: query,
      limit: limit,
      skip: skip,
      sort: { timestamp: -1 }
    }) as any[];
    
    // Get total count for pagination
    const totalCount = await runQuery({
      collection: 'deposits_withdrawals',
      operation: 'count',
      query: query
    }) as number;
    
    console.log(`Found ${transactions.length} transactions out of ${totalCount} total`);
    
    // Process transactions
    const processedTransactions = transactions.map(tx => processTransaction(tx));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({
      success: true,
      data: processedTransactions,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching deposits and withdrawals:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch deposits and withdrawals: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 