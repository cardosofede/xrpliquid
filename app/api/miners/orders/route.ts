import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Processed order interface for the frontend
interface ProcessedOrder {
  orderId: string;
  account: string;
  pair: string;
  side: "BUY" | "SELL" | "UNKNOWN";
  originalAmount: string;
  price: string;
  amount: string;
  filledAmount: string | null;
  executedPrice: string | null;
  status: string;
  date: string;
  fee: string;
  rawData: any; // Include the raw data for additional processing if needed
}

// Format an order for the frontend
function processOrder(order: any): ProcessedOrder {
  // Use the pre-calculated values from the database
  return {
    orderId: order.hash || "Unknown",
    account: order.account || "Unknown",
    pair: order.trading_pair?.id || "Unknown/Unknown",
    side: (order.market_side || "unknown").toUpperCase(),
    originalAmount: order.original_amount?.toString() || "0",
    price: order.price?.toString() || "0",
    amount: order.original_amount?.toString() || "0",
    filledAmount: order.executed_amount?.toString() || null,
    executedPrice: order.executed_price?.toString() || null,
    status: order.status === "filled" ? "Filled" : order.status === "canceled" ? "Cancelled" : "Open",
    date: order.resolution_date || order.canceled_date || order.created_date || new Date().toISOString(),
    fee: order.fee_xrp?.toString() || "0",
    rawData: order
  };
}

// Handler for GET requests
export async function GET(request: Request) {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    console.log('Fetching order history...')
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const userId = searchParams.get('userId');
    const tradingPair = searchParams.get('tradingPair');
    const side = searchParams.get('side');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || String(MONGODB.DEFAULT_LIMIT), 10)
    const skip = (page - 1) * limit
    
    console.log('Order history request params:', { userId, tradingPair, side, status, page, limit });
    
    // Import the db module
    const { runQuery } = await import('@/lib/db')
    
    // Base query - filter by user ID if provided
    let baseQuery: any = userId ? { user_id: userId } : {};
    
    // Add trading pair filter if specified
    if (tradingPair && tradingPair !== 'ALL') {
      baseQuery["trading_pair.id"] = tradingPair;
    }
    
    // Add side filter if specified
    if (side) {
      baseQuery.market_side = side.toLowerCase();
    }
    
    // Create query for different status filters
    let filledQuery = { ...baseQuery };
    let canceledQuery = { ...baseQuery };
    
    // Filter by status if specified
    if (status) {
      if (status === 'Filled') {
        canceledQuery = { _id: { $exists: false } }; // No results
      } else if (status === 'Cancelled') {
        filledQuery = { _id: { $exists: false } }; // No results
      }
    }
    
    // Log the queries for debugging
    console.log('MongoDB queries:', { filledQuery, canceledQuery });
    
    // Fetch filled orders
    const filledOrders = await runQuery({
      collection: 'filled_orders',
      operation: 'find',
      query: filledQuery,
      limit: limit,
      skip: skip,
      sort: { resolution_date: -1 }
    }) as any[];
    
    // Fetch canceled orders
    const canceledOrders = await runQuery({
      collection: 'canceled_orders',
      operation: 'find',
      query: canceledQuery,
      limit: limit,
      skip: skip,
      sort: { canceled_date: -1 }
    }) as any[];
    
    console.log(`Found ${filledOrders.length} filled orders and ${canceledOrders.length} canceled orders`);
    
    // Process orders
    const processedFilledOrders = filledOrders.map(order => processOrder(order));
    const processedCanceledOrders = canceledOrders.map(order => processOrder(order));
    
    // Combine all processed orders
    let allProcessedOrders = [...processedFilledOrders, ...processedCanceledOrders];
    
    // Sort by date (newest first) and limit the results
    const orders = allProcessedOrders
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
    
    // Get total counts for pagination
    const totalCount = allProcessedOrders.length;
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Retrieved ${orders.length} processed orders (page ${page}/${totalPages})`);
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching order history:', error)
    
    return NextResponse.json({
      success: false,
      error: `Failed to fetch order history: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}