import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Handler for GET requests
export async function GET() {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    console.log('Fetching transaction date range...')
    
    // Import the db module here to ensure it's only loaded on the server
    const { runQuery } = await import('@/lib/db')
    
    // Get transactions for date range analysis using the server-safe db utility
    const transactions = await runQuery({
      collection: 'transactions',
      operation: 'find',
      limit: MONGODB.DEFAULT_LIMIT
    })
    
    console.log(`Retrieved ${transactions.length} transactions`)
    
    // Find min and max dates in the transactions
    let minDate = new Date()
    let maxDate = new Date()
    
    if (transactions.length > 0) {
      // Sort transactions by timestamp (either createdAt or updatedAt)
      const sortedByCreation = [...transactions].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date()
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date()
        return dateA.getTime() - dateB.getTime()
      })
      
      const sortedByRecent = [...transactions].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date() 
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date()
        return dateB.getTime() - dateA.getTime()
      })
      
      minDate = sortedByCreation[0].createdAt ? new Date(sortedByCreation[0].createdAt) : new Date()
      maxDate = sortedByRecent[0].createdAt ? new Date(sortedByRecent[0].createdAt) : new Date()
      console.log(`Date range: ${minDate.toISOString()} - ${maxDate.toISOString()}`)
    } else {
      console.log('No transactions found, using current date')
    }
    
    return NextResponse.json({ 
      success: true, 
      minDate, 
      maxDate,
      transactionCount: transactions.length
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