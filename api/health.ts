/**
 * Vercel Serverless Function: /api/health
 * Lightweight uptime and system health check for UptimeRobot / BetterStack.
 * Performs a minimal read-only check against Supabase without exposing internal credentials.
 */

export const config = {
  runtime: 'nodejs',
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lqzrahjmgzdsbosywjju.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({
      status: 'unhealthy',
      reason: 'database_configuration_missing',
      timestamp: new Date().toISOString(),
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(503).json({
        status: 'degraded',
        reason: 'database_unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    clearTimeout(timeout);
    return res.status(503).json({
      status: 'unhealthy',
      reason: 'service_timeout_or_network_error',
      timestamp: new Date().toISOString(),
    });
  }
}
