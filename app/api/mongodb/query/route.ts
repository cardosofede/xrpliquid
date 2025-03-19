import { NextResponse } from 'next/server';
import { initializeMongoDB } from '@/app/api/_serverUtils';

export async function POST(request: Request) {
  try {
    // Initialize MongoDB first
    const initResult = await initializeMongoDB();
    if (!initResult.success) {
      console.error('Failed to initialize MongoDB:', initResult.error);
      return NextResponse.json({
        status: 'error',
        error: 'Failed to initialize MongoDB connection',
        details: initResult.error
      }, { status: 500 });
    }
    
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({
        status: 'error',
        error: 'Invalid request body format',
      }, { status: 400 });
    }
    
    const { collection, operation, query, limit = 100, sort, skip } = body;
    
    // Validate required parameters
    if (!collection) {
      return NextResponse.json({
        status: 'error',
        error: 'Collection name is required',
      }, { status: 400 });
    }
    
    // Log the request details for debugging
    console.log('MongoDB Query Request:', {
      collection,
      operation: operation || 'find',
      query: query || {},
      limit: Number(limit)
    });
    
    // Import the database utilities
    const { runQuery } = await import('@/lib/db');
    
    // Execute the query with timeout and retry logic
    let result;
    try {
      result = await Promise.race([
        runQuery({
          collection,
          operation: operation || 'find',
          query: query || {},
          limit: Number(limit),
          sort,
          skip: Number(skip) || 0,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
        )
      ]);
    } catch (queryError) {
      console.error(`MongoDB query execution error (${collection}.${operation}):`, queryError);
      
      // Return a more detailed error response
      return NextResponse.json({
        status: 'error',
        error: 'Failed to execute query',
        details: queryError instanceof Error ? queryError.message : 'Unknown error',
        collection,
        operation: operation || 'find'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: 'success',
      operation: operation || 'find',
      collection,
      result,
      count: Array.isArray(result) ? result.length : 1,
    });
  } catch (error) {
    console.error('Failed to execute MongoDB query:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 