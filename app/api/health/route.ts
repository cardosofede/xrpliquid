import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { initializeMongoDB } from '@/app/api/_serverUtils'

// Health check handler - Next.js 15 requires Route Handlers to be defined directly
export async function GET() {
  console.log('Health check requested')
  
  try {
    // Initialize MongoDB first
    await initializeMongoDB();
    
    // Import the database utilities
    const { getMongoClient } = await import('@/lib/db')
    
    // Test MongoDB connection
    const client = await getMongoClient()
    const mongoStatus = client.topology?.isConnected() 
      ? 'connected' 
      : 'disconnected'
    
    // Get basic server info
    const serverInfo = await client.db().admin().serverInfo().catch(() => null)
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        status: mongoStatus,
        uri: MONGODB.URI.replace(/:[^:@]+@/, ':***@'), // Hide password
        db: MONGODB.DB_NAME,
        version: serverInfo?.version || 'unknown'
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
      mongodb: {
        status: 'error',
        uri: MONGODB.URI.replace(/:[^:@]+@/, ':***@') // Hide password
      }
    }, { status: 500 })
  }
} 