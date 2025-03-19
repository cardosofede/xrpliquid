import { NextResponse } from 'next/server'
import { MONGODB } from '@/lib/config'
import { withMongoDB } from '@/app/api/_serverUtils'

// Health check handler
async function handleGET() {
  console.log('Health check requested')
  
  try {
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

// Export the handler with MongoDB initialization
export const GET = withMongoDB(handleGET) 