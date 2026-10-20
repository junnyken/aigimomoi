// AG-25: Healthcheck & Observability API
// Cung cấp endpoint liveness/readiness probe cho Docker Compose, Caddy và monitoring.
// Invariant: Tuyệt đối không để lộ secrets, connection strings, credentials trong response hay error logs.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  database: 'connected' | 'disconnected';
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  const uptimeSeconds = Math.floor(process.uptime());
  const environment = process.env.NODE_ENV || 'development';
  const version = '0.1.0';

  try {
    // Probe database connectivity
    await db.execute(sql`SELECT 1`);

    const response: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment,
      version,
      database: 'connected',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time-Ms': String(Date.now() - startTime),
      },
    });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }

    const errorMessage = err instanceof Error ? err.message : 'Database connection error';
    logger.error('Healthcheck probe failed', { error: errorMessage });

    // Trả về 503 Service Unavailable nhưng an toàn, không lộ credentials
    const response: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      environment,
      version,
      database: 'disconnected',
      error: 'Database connection failed',
    };

    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time-Ms': String(Date.now() - startTime),
      },
    });
  }
}
