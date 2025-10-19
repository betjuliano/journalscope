import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const originHeader = req.headers.get('origin')
  const origin = originHeader || 'http://localhost:5173'

  // Logging básico de requisição
  try {
    console.log(`API Request: ${req.method} ${req.nextUrl.pathname} origin=${originHeader || 'n/a'}`)
  } catch {}

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Expose-Headers': 'Content-Length, X-Request-Id',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const res = NextResponse.next()
  Object.entries(corsHeaders).forEach(([key, value]) => res.headers.set(key, value))
  return res
}

export const config = {
  matcher: ['/api/:path*']
}