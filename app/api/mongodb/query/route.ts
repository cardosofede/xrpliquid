import { NextResponse } from 'next/server';
import { initializeMongoDB } from '@/app/api/_serverUtils';

export async function POST(request: Request) {
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    // Parse the request body
    const body = await request.json();
    const { collection, operation, query, limit = 100, sort, skip } = body;
    
    // Validate required parameters
    if (!collection) {
      return NextResponse.json({
        status: 'error',
        error: 'Collection name is required',
      }, { status: 400 });
    }
    
    // Import the database utilities
    const { runQuery } = await import('@/lib/db');
    
    // Execute the query
    const result = await runQuery({
      collection,
      operation: operation || 'find',
      query: query || {},
      limit: Number(limit),
      sort,
      skip: Number(skip) || 0,
    });
    
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