import { NextResponse } from 'next/server';
import { getCollectionInfo } from '@/lib/db';

/**
 * API route to get MongoDB collection information
 * This helps Cursor understand your MongoDB schema structure
 */
export async function GET() {
  try {
    // Get information about all collections
    const collectionsInfo = await getCollectionInfo();
    
    // Return collection information
    return NextResponse.json({ 
      success: true, 
      collections: collectionsInfo 
    });
  } catch (error) {
    console.error('Error fetching MongoDB info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch MongoDB information' 
      }, 
      { status: 500 }
    );
  }
} 