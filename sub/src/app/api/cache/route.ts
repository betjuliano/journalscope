// API Route para gerenciar cache Redis
import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    const value = await cacheService.get(key);
    
    return NextResponse.json({
      success: true,
      key,
      value,
      cached: value !== null
    });
  } catch (error) {
    console.error('Cache GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl = 3600 } = body;
    
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    const success = await cacheService.set(key, value, ttl);
    
    return NextResponse.json({
      success,
      key,
      ttl,
      message: success ? 'Value cached successfully' : 'Failed to cache value'
    });
  } catch (error) {
    console.error('Cache POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const action = searchParams.get('action');
    
    if (action === 'flush') {
      const success = await cacheService.flush();
      return NextResponse.json({
        success,
        message: success ? 'Cache flushed successfully' : 'Failed to flush cache'
      });
    }
    
    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    const success = await cacheService.del(key);
    
    return NextResponse.json({
      success,
      key,
      message: success ? 'Key deleted successfully' : 'Failed to delete key'
    });
  } catch (error) {
    console.error('Cache DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
