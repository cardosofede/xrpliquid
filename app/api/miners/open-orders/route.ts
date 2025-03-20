import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Handler for GET requests
export async function GET(request: Request) {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    console.log('Fetching open orders with pagination...')
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const tradingPair = searchParams.get('tradingPair');
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '15', 10) // Default to 15 records per page
    const skip = (page - 1) * limit
    
    console.log('Open orders request params:', { userId, tradingPair, page, limit, skip });
    
    // Import the db module
    const { runQuery } = await import('@/lib/db')
    
    // Create query - filter by user_id and optionally trading pair
    let mongoQuery: any = userId ? { user_id: userId } : {};
    
    // Add trading pair filter if specified
    if (tradingPair && tradingPair !== 'ALL') {
      mongoQuery["trading_pair.id"] = tradingPair;
    }
    
    // Log the actual query for debugging
    console.log('MongoDB query for open orders:', JSON.stringify(mongoQuery));
    
    // Fetch open orders with the filter and pagination
    let openOrders: any[] = [];
    try {
      const result = await runQuery({
        collection: 'open_orders',
        operation: 'find',
        query: mongoQuery,
        limit,
        skip,
        sort: { created_date: -1 } // Sort by creation date, newest first
      });
      
      if (Array.isArray(result)) {
        openOrders = result;
      }
    } catch (dbError) {
      console.error('MongoDB query error:', dbError);
    }
    
    // Get total count for pagination
    let totalCount = 0;
    try {
      const countResult = await runQuery({
        collection: 'open_orders',
        operation: 'count',
        query: mongoQuery
      });
      
      if (typeof countResult === 'number') {
        totalCount = countResult;
      }
    } catch (countError) {
      console.error('MongoDB count error:', countError);
    }
    
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Found ${openOrders.length} open orders for page ${page}/${totalPages} (total count: ${totalCount})`);
    
    return NextResponse.json({
      success: true,
      data: openOrders,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching open orders:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch open orders: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
} 