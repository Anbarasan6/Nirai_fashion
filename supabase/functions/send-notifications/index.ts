// Supabase Edge Function: send-notifications
// Invoked via database webhook on outbox insert or scheduled cron (every 5 minutes).
//
// Key Features:
// 1. Caller Authentication: Requires x-webhook-secret matching NOTIFY_WEBHOOK_SECRET or service role token.
// 2. Strict Privacy: NEVER exposes recipient email addresses or payload data in responses or logs.
// 3. Concurrency Protection: Calls atomic RPC `claim_notifications()` using FOR UPDATE SKIP LOCKED.
// 4. Exponential Backoff: Failed attempts increment attempts and delay next_attempt_at; marked 'failed' after 5 attempts.
// 5. Bilingual Templates: Mobile-responsive HTML + plain text with HTML sanitization.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderEmail } from './templates/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface ClaimedRow {
  id: string;
  type: string;
  order_id: string;
  order_number: string;
  submission_id: string | null;
  to_email: string;
  to_phone: string | null;
  locale: 'en' | 'ta';
  payload: Record<string, any>;
  attempts: number;
}

// Calculate exponential backoff duration based on retry attempt
function getBackoffMinutes(attempt: number): number {
  switch (attempt) {
    case 1:
      return 5;
    case 2:
      return 15;
    case 3:
      return 45;
    case 4:
      return 120; // 2 hours
    default:
      return 360; // 6 hours
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const expectedSecret = Deno.env.get('NOTIFY_WEBHOOK_SECRET');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const notifyFromEmail = Deno.env.get('NOTIFY_FROM_EMAIL') || 'Nirai Handlooms <onboarding@resend.dev>';
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'http://localhost:3000';
    const isDomainVerified = Deno.env.get('NOTIFY_DOMAIN_VERIFIED') === 'true';

    if (!isDomainVerified) {
      console.warn(
        '[send-notifications] WARNING: NOTIFY_DOMAIN_VERIFIED is not true. Resend will only deliver to the account owner in sandbox mode until custom domain DNS records (SPF/DKIM/DMARC) are verified.'
      );
    }

    // 1. Caller Authentication
    const incomingSecret = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization') || '';
    const isServiceRole = Boolean(supabaseServiceKey && authHeader === `Bearer ${supabaseServiceKey}`);
    const isSecretValid = Boolean(expectedSecret && incomingSecret === expectedSecret);

    let isAdminOrStaff = false;
    if (authHeader.startsWith('Bearer ') && !isServiceRole && supabaseUrl) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const adminCheckClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user } } = await adminCheckClient.auth.getUser(token);
        if (user) {
          const { data: profile } = await adminCheckClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile && ['staff', 'admin', 'super_admin'].includes(profile.role)) {
            isAdminOrStaff = true;
          }
        }
      } catch {
        isAdminOrStaff = false;
      }
    }

    if (!isServiceRole && !isSecretValid && !isAdminOrStaff) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Caller must provide valid webhook secret or authenticated staff token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing database service credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Claim pending rows atomically using FOR UPDATE SKIP LOCKED
    const { data: claimedRows, error: claimError } = await supabase.rpc('claim_notifications', {
      p_limit: 20,
    });

    if (claimError) {
      console.error('[send-notifications] Error claiming notifications:', claimError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to claim outbox records' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rows: ClaimedRow[] = claimedRows || [];
    let sentCount = 0;
    let failedCount = 0;

    // 3. Process each claimed notification
    for (const row of rows) {
      const { subject, html, text } = renderEmail(row.type, {
        orderNumber: row.order_number,
        payload: row.payload || {},
        locale: row.locale,
        siteUrl,
      });

      let sendSuccess = false;
      let errorMsg: string | null = null;

      // Handle sending (Resend API or Mock Mode)
      if (resendApiKey) {
        try {
          // If admin alert with multiple recipients in payload, send to all
          const recipients = Array.isArray(row.payload?.admin_emails) && row.payload.admin_emails.length > 0
            ? row.payload.admin_emails
            : [row.to_email];

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: notifyFromEmail,
              to: recipients,
              subject,
              html,
              text,
            }),
          });

          if (!resendResponse.ok) {
            const errData = await resendResponse.json().catch(() => ({}));
            errorMsg = errData.message || `Resend HTTP error ${resendResponse.status}`;
          } else {
            sendSuccess = true;
          }
        } catch (netErr: any) {
          errorMsg = netErr?.message || 'Network error communicating with Resend';
        }
      } else {
        // Mock Mode (when RESEND_API_KEY is not configured in local environment)
        sendSuccess = true;
      }

      // 4. Update status with exponential backoff on failure
      const currentAttempts = (row.attempts || 0) + 1;

      if (sendSuccess) {
        await supabase
          .from('notifications_outbox')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: currentAttempts,
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        sentCount++;
        // Strict Privacy: Sanitized log without recipient PII
        console.log(`[send-notifications] Sent notification id=${row.id} type=${row.type} order=${row.order_number.slice(0, 5)}***`);
      } else {
        const hasExceededMaxRetries = currentAttempts >= 5;
        const nextAttemptMinutes = getBackoffMinutes(currentAttempts);
        const nextAttemptAt = hasExceededMaxRetries
          ? null
          : new Date(Date.now() + nextAttemptMinutes * 60 * 1000).toISOString();

        await supabase
          .from('notifications_outbox')
          .update({
            status: hasExceededMaxRetries ? 'failed' : 'pending',
            attempts: currentAttempts,
            last_error: errorMsg,
            next_attempt_at: nextAttemptAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        failedCount++;
        // Strict Privacy: Sanitized error log without recipient email
        console.error(`[send-notifications] Attempt ${currentAttempts} failed for id=${row.id} type=${row.type}: ${errorMsg}`);
      }
    }

    // Return aggregate counts only (Zero recipient PII)
    return new Response(
      JSON.stringify({
        success: true,
        processed_count: rows.length,
        sent_count: sentCount,
        failed_count: failedCount,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-notifications] Unexpected handler error:', err?.message || err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
