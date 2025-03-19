import { NextRequest, NextResponse } from 'next/server';

// This middleware file is special in Next.js
// It runs on the edge before any other code
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log API requests for debugging
  if (pathname.startsWith('/api/')) {
    console.log(`API Request: ${request.method} ${pathname}`);
  }
  
  return NextResponse.next();
}

// Don't run this middleware on static files or API routes that handle their own MongoDB connections
export const config = {
  matcher: [
    // Match API routes for logging
    '/api/:path*',
    // Match all other routes except static resources
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 