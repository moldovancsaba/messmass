import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import mongoose from 'mongoose';

/**
 * GET /api/v3/health
 * Verifies the V3 Mongoose connection status and environment.
 */
export async function GET() {
  try {
    const startTime = Date.now();
    await connectV3();
    const connectionState = mongoose.connection.readyState;
    
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      v3_mongoose_connection: states[connectionState],
      latency_ms: Date.now() - startTime,
      environment: process.env.NODE_ENV,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ V3 Health Check Failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
