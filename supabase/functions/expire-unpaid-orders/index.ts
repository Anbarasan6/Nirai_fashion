// Supabase Scheduled Edge Function: Expire Unpaid Orders
// Invoked periodically (e.g. every 15 minutes) via pg_cron, Supabase Cron, or GitHub Actions.
// Calls the idempotent database RPC `expire_unpaid_orders()`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
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

    const expiredCount = data ?? 0;
    console.log(`expire_unpaid_orders executed successfully. Expired orders count: ${expiredCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
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
