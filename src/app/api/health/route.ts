// AG-25: Healthcheck & Observability API
// Cung cấp endpoint liveness/readiness probe cho Docker Compose, Caddy và monitoring.
// Invariant: Tuyệt đối không để lộ secrets, connection strings, credentials trong response hay error logs.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDatabaseBootstrapped } from '@/lib/db/autoBootstrap';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { isAuthConfigurationValid, getSessionUser } from '@/lib/auth/session';

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptimeSeconds?: number;
  environment?: string;
  version?: string;
  database: 'connected' | 'disconnected';
  auth: 'ready' | 'unconfigured';
  error?: string;
}

export async function GET(request?: Request) {
  const startTime = Date.now();
  const authValid = isAuthConfigurationValid();

  // Chỉ hiển thị thông tin hạ tầng chi tiết (uptime, environment, version) cho ADMIN
  let includeDiagnostics = false;
  if (authValid && request) {
    try {
      const user = await getSessionUser(request);
      includeDiagnostics = user?.role === 'ADMIN';
    } catch {
      includeDiagnostics = false;
    }
  }
  const diagnostics = includeDiagnostics
    ? {
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: '0.1.0',
      }
    : {};

  try {
    // Probe database connectivity & ensure schema/catalog bootstrapped on first live connection
    await db.execute(sql`SELECT 1`);
    void ensureDatabaseBootstrapped();

    if (!authValid) {
      logger.warn('Healthcheck readiness probe failed: AUTH_SECRET is not configured or invalid');
      const response: HealthResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        ...diagnostics,
        database: 'connected',
        auth: 'unconfigured',
        error: 'Authentication configuration invalid or missing',
      };
      return NextResponse.json(response, {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Response-Time-Ms': String(Date.now() - startTime),
        },
      });
    }

    const response: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ...diagnostics,
      database: 'connected',
      auth: 'ready',
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
      ...diagnostics,
      database: 'disconnected',
      auth: authValid ? 'ready' : 'unconfigured',
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
