import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { withMongoDB } from '@/app/api/_serverUtils'

// Handler for GET requests
async function handleGET(request: Request) {
  try {
    console.log('Fetching transactions...')
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || String(MONGODB.DEFAULT_LIMIT), 10)
    const skip = (page - 1) * limit
    
    // Import the db module here to ensure it's only loaded on the server
    const { runQuery } = await import('@/lib/db')
    
    // Fetch transactions with pagination
    const transactions = await runQuery({
      collection: 'transactions',
      operation: 'find',
      skip,
      limit,
      sort: { createdAt: -1 } // Sort by creation date, newest first
    })
    
    // Get total count for pagination
    const totalCount = await runQuery({
      collection: 'transactions',
      operation: 'count'
    })
    
    const totalPages = Math.ceil(totalCount / limit)
    
    console.log(`Retrieved ${transactions.length} transactions (page ${page}/${totalPages})`)
    
    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

// Handler for POST requests
async function handlePOST(request: Request) {
  try {
    const body = await request.json()
    console.log('Creating new transaction:', body)
    
    // Validate required fields
    if (!body.txid || !body.account) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: txid and account are required'
      }, { status: 400 })
    }
    
    // Import the db module here to ensure it's only loaded on the server
    const { runQuery } = await import('@/lib/db')
    
    // Check if transaction already exists
    const existingTransaction = await runQuery({
      collection: 'transactions',
      operation: 'findOne',
      query: { txid: body.txid }
    })
    
    if (existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction with this txid already exists'
      }, { status: 409 })
    }
    
    // Add timestamps
    const now = new Date()
    const transaction = {
      ...body,
      createdAt: now,
      updatedAt: now
    }
    
    // Insert the new transaction
    const result = await runQuery({
      collection: 'transactions',
      operation: 'insertOne',
      document: transaction
    })
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...transaction }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to create transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

// Export handlers with MongoDB initialization
export const GET = withMongoDB(handleGET)
export const POST = withMongoDB(handlePOST) 