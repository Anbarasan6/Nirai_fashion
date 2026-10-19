// Supabase Scheduled Edge Function: Expire Unpaid Orders
// Invoked periodically (e.g. every 15 minutes) via pg_cron, Supabase Cron, or GitHub Actions.
// Calls the idempotent database RPC `expire_unpaid_orders()`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    // 1. Authenticate caller: Must supply valid CRON_SECRET or service role bearer token
    const incomingCronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('authorization') || '';
    const isServiceRole = Boolean(supabaseServiceKey && authHeader === `Bearer ${supabaseServiceKey}`);
    const isCronSecretValid = Boolean(expectedCronSecret && incomingCronSecret === expectedCronSecret);

    if (!isServiceRole && !isCronSecretValid) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Function requires a valid x-cron-secret header or service role authorization token.',
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to cancel overdue orders and restore stock
    const { data, error } = await supabase.rpc('expire_unpaid_orders');

    if (error) {
      console.error('Error invoking expire_unpaid_orders:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const expiredResult = data ?? {};
    const expiredCount = typeof expiredResult === 'object' && expiredResult !== null
      ? (expiredResult.expired_count ?? 0)
      : (typeof expiredResult === 'number' ? expiredResult : 0);

    console.log(`expire_unpaid_orders executed successfully. Expired orders count: ${expiredCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        details: expiredResult,
        executed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unexpected error in expire-unpaid-orders:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
