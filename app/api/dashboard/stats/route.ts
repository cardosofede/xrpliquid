import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { runQuery } from '@/lib/db'

// Basic type definitions
interface User {
  id?: string;
  wallets?: string[];
  [key: string]: any;
}

interface Trade {
  TakerGets?: {
    value: string;
    currency: string;
  };
  TakerPays?: {
    value: string;
    currency: string;
  };
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    console.log('Fetching dashboard stats...')
    
    // Parse the URL to get any query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    console.log('Stats request params:', { userId });
    console.log('MongoDB configuration:', {
      URI: MONGODB.URI,
      DB_NAME: MONGODB.DB_NAME,
      DEFAULT_LIMIT: MONGODB.DEFAULT_LIMIT
    })
    
    // If userId is provided, use it to filter queries
    const userFilter = userId ? getUserFilterQuery(userId) : {};
    
    // Get users count directly with count operation
    console.log('Counting users...')
    const userCount = await runQuery({
      collection: 'users',
      operation: 'count',
      query: userId ? { id: userId } : {}
    }) as number;
    console.log(`User count: ${userCount}`)
    
    // For wallets, first get all users (or the specific user if userId provided)
    console.log('Fetching users for wallet counting...')
    const users = await runQuery({
      collection: 'users',
      operation: 'find',
      query: userId ? { id: userId } : {}
    }) as User[];
    console.log(`Retrieved ${users.length} users for wallet processing`)
    
    // Count unique wallets
    const uniqueWallets = new Set<string>()
    users.forEach((user: User) => {
      if (user.wallets) {
        user.wallets.forEach((wallet: string) => uniqueWallets.add(wallet))
      }
    })
    const walletCount = uniqueWallets.size
    console.log(`Found ${walletCount} unique wallets`)
    
    // Get transaction count directly, filtered by userId if provided
    console.log('Counting transactions...')
    const transactionCount = await runQuery({
      collection: 'transactions',
      operation: 'count',
      query: userFilter
    }) as number;
    console.log(`Transaction count: ${transactionCount}`)
    
    // Get trades for volume calculation, filtered by userId if provided
    console.log('Fetching trades...')
    const trades = await runQuery({
      collection: 'trades',
      operation: 'find',
      query: userFilter,
      limit: MONGODB.DEFAULT_LIMIT
    }) as Trade[];
    console.log(`Retrieved ${trades.length} trades`)
    
    // Calculate total volume - this is simplified and should be adjusted based on actual data structure
    let totalVolume = 0
    trades.forEach((trade: Trade) => {
      // Assuming there's an amount field in trades - adjust according to your actual data structure
      if (trade.TakerGets?.value) {
        totalVolume += parseFloat(trade.TakerGets.value)
      } else if (trade.TakerPays?.value) {
        totalVolume += parseFloat(trade.TakerPays.value)
      }
    })
    console.log(`Calculated total volume: ${totalVolume}`)
    
    // Calculate per-asset volume
    const assetVolumes: Record<string, number> = {}
    trades.forEach((trade: Trade) => {
      // Extract asset from trade data - adjust according to your actual data structure
      const asset = trade.TakerGets?.currency || trade.TakerPays?.currency || 'Unknown'
      
      if (!assetVolumes[asset]) {
        assetVolumes[asset] = 0
      }
      
      if (trade.TakerGets?.value && trade.TakerGets?.currency === asset) {
        assetVolumes[asset] += parseFloat(trade.TakerGets.value)
      } else if (trade.TakerPays?.value && trade.TakerPays?.currency === asset) {
        assetVolumes[asset] += parseFloat(trade.TakerPays.value)
      }
    })
    console.log('Asset volumes:', assetVolumes)
    
    return NextResponse.json({
      success: true,
      stats: {
        userCount,
        walletCount,
        transactionCount,
        totalVolume,
        assetVolumes
      },
      userCount,
      walletCount,
      transactionCount,
      totalVolume,
      assetVolumes
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Include more details for Docker debugging
    console.error('Environment:', {
      MONGO_URI: process.env.MONGO_URI,
      MONGO_DB_NAME: process.env.MONGO_DB_NAME,
      NODE_ENV: process.env.NODE_ENV
    })
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch dashboard statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

// Helper function to create a filter query for a user ID that tries multiple field combinations
function getUserFilterQuery(userId: string) {
  if (!userId) return {};
  
  return {
    $or: [
      // User ID fields
      { user_id: userId },
      { userId: userId },
      { id: userId },
      // Account fields
      { account: userId },
      { Account: userId },
      { address: userId },
      // Try lowercase/uppercase variations
      { user_id: userId.toLowerCase() },
      { userId: userId.toLowerCase() },
      { id: userId.toLowerCase() },
      { account: userId.toLowerCase() },
      { Account: userId.toLowerCase() },
      { address: userId.toLowerCase() }
    ]
  };
} 