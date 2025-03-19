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

export async function GET() {
  try {
    console.log('Fetching dashboard stats...')
    
    // Get users count
    console.log('Fetching users...')
    const users = await runQuery({
      collection: 'users',
      operation: 'find'
    }) as User[];
    const userCount = users.length
    console.log(`Retrieved ${userCount} users`)
    
    // Count unique wallets
    const uniqueWallets = new Set<string>()
    users.forEach((user: User) => {
      if (user.wallets) {
        user.wallets.forEach((wallet: string) => uniqueWallets.add(wallet))
      }
    })
    const walletCount = uniqueWallets.size
    console.log(`Found ${walletCount} unique wallets`)
    
    // Get transactions
    console.log('Fetching transactions...')
    const transactions = await runQuery({
      collection: 'transactions',
      operation: 'find',
      limit: MONGODB.DEFAULT_LIMIT
    })
    const transactionCount = transactions.length
    console.log(`Retrieved ${transactionCount} transactions`)
    
    // Get trades for volume calculation
    console.log('Fetching trades...')
    const trades = await runQuery({
      collection: 'trades',
      operation: 'find',
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
      }
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