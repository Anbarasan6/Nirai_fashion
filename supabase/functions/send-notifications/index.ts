// Supabase Edge Function: send-notifications
// Invoked via database webhook, pg_net, scheduled cron, or admin dispatch.
// Processes queued notifications from `notifications_outbox` and sends via Resend.
//
// Security Requirements:
// 1. Caller Authentication: requires valid `x-webhook-secret` header or service role bearer token.
// 2. Strict Privacy: NEVER exposes recipient email addresses or PII in logs or HTTP responses.
// 3. Configurable Sender: Reads `NOTIFY_FROM_EMAIL` (default: 'Nirai Handlooms <onboarding@resend.dev>').

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface NotificationRow {
  id: string;
  order_id: string;
  order_number: string;
  event_type: string;
  submission_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  payload: Record<string, any>;
  status: string;
  attempts: number;
}

// Generate rich, responsive HTML emails for each notification lifecycle event
function buildEmailHtml(event_type: string, order_number: string, payload: Record<string, any>, appUrl: string): string {
  const brandColor = '#2D1619';
  const goldAccent = '#D4AF37';
  const payUrl = `${appUrl}/pay/${encodeURIComponent(order_number)}`;
  const trackingUrl = payload.trackingUrl || `${appUrl}/tracking/${encodeURIComponent(order_number)}`;
  const adminVerifyUrl = `${appUrl}/admin/orders?tab=payments`;

  const header = `
    <div style="background-color: ${brandColor}; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #FAF6F0; margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px;">NIRAI · நிறை</h1>
      <p style="color: ${goldAccent}; margin: 4px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Authentic South Indian Handloom</p>
    </div>
  `;

  const footer = `
    <div style="background-color: #F8F6F0; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #78716C; margin-top: 24px; border-top: 1px solid #E7E5E4;">
      <p style="margin: 0 0 8px 0;">Need assistance with your handloom order? Contact our support desk at <a href="mailto:care@nirai.in" style="color: #881337; text-decoration: none;">care@nirai.in</a> or WhatsApp: +91 94432 11098.</p>
      <p style="margin: 0; font-size: 11px; color: #A8A29E;">© ${new Date().getFullYear()} Nirai Traditional Ethnic Apparel. 10 Cathedral Road, Chennai, Tamil Nadu - 600086.</p>
    </div>
  `;

  let bodyContent = '';

  switch (event_type) {
    case 'order_placed':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Vanakkam! Your Order #${order_number} is Received</h2>
        <p style="color: #44403C; line-height: 1.6;">Thank you for preserving South Indian handloom craftsmanship. We have reserved your woven pieces. To confirm your order, please complete your offline UPI or Bank Transfer payment before the deadline.</p>
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E; font-weight: bold; font-size: 14px;">Total Amount: ₹${Number(payload.grand_total || 0).toLocaleString()}</p>
          <p style="margin: 6px 0 0 0; color: #B45309; font-size: 12px;">Payment Window: 24 Hours. Your handloom stock is currently locked.</p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${payUrl}" style="background-color: #881337; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">Pay Now &amp; Submit Proof →</a>
        </div>
        <p style="color: #78716C; font-size: 12px;">You can also view QR codes, bank details, and submit your 12-digit UTR directly at: <br/><a href="${payUrl}" style="color: #881337;">${payUrl}</a></p>
      `;
      break;

    case 'payment_proof_received':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Payment Proof Received for #${order_number}</h2>
        <p style="color: #44403C; line-height: 1.6;">We have received your payment reference (<strong>UTR: ${payload.utr || 'Submitted'}</strong>, Amount: ₹${Number(payload.amount_paid || 0).toLocaleString()}).</p>
        <p style="color: #44403C; line-height: 1.6;">Our store operations team reconciles incoming UPI and bank credits manually against our merchant statements. Verification typically takes between <strong>2 to 4 business hours</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="background-color: #44403C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">View Live Status</a>
        </div>
      `;
      break;

    case 'payment_verified':
      bodyContent = `
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #065F46; font-family: Georgia, serif; margin: 0 0 8px 0;">✓ Payment Verified &amp; Order Confirmed!</h2>
          <p style="color: #047857; margin: 0; font-size: 13px;">Your payment for Order #${order_number} has been authenticated against our accounts.</p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">Our master weavers and packaging team are now preparing your handloom sarees for dispatch. You will receive an SMS and email with courier tracking details as soon as the parcel is handed over.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="background-color: #047857; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Track Order Processing</a>
        </div>
      `;
      break;

    case 'payment_rejected':
      bodyContent = `
        <div style="background-color: #FFF1F2; border: 1px solid #FECDD3; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #9F1239; font-family: Georgia, serif; margin: 0 0 8px 0;">Payment Verification Update for #${order_number}</h2>
          <p style="color: #BE123C; margin: 0; font-size: 13px;">Our accounting team was unable to verify the reference submitted (UTR: ${payload.utr || 'N/A'}).</p>
        </div>
        <div style="background-color: #F5F5F4; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #E11D48; margin: 16px 0;">
          <p style="margin: 0; color: #44403C; font-size: 13px;"><strong>Reason:</strong> ${payload.reject_reason || 'UTR could not be matched with bank credit statement.'}</p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">Don&apos;t worry — your handloom order is still reserved until the payment deadline. Please double check your bank statement or UPI app and resubmit your 12-digit UTR:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payUrl}" style="background-color: #E11D48; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Resubmit Payment Reference →</a>
        </div>
      `;
      break;

    case 'payment_reminder':
      bodyContent = `
        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #92400E; font-family: Georgia, serif; margin: 0 0 8px 0;">⚠️ Urgent: 4 Hours Remaining for Order #${order_number}</h2>
          <p style="color: #B45309; margin: 0; font-size: 13px;">Your handloom reservation is approaching its expiration window.</p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">To prevent your reserved handloom sarees from being returned to public inventory, please complete your UPI or Bank Transfer and submit your proof:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payUrl}" style="background-color: #B45309; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Complete Payment Now →</a>
        </div>
      `;
      break;

    case 'order_expired':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Order #${order_number} Expired</h2>
        <p style="color: #44403C; line-height: 1.6;">The payment window for your order has concluded without a verified transaction. As our items are limited handloom creations, the reserved pieces have been returned to active stock.</p>
        <p style="color: #44403C; line-height: 1.6;">If you already transferred funds, please reach out to our team at <a href="mailto:care@nirai.in" style="color: #881337;">care@nirai.in</a> with your statement copy and we will gladly assist you.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}/catalog" style="background-color: #44403C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Browse Handlooms</a>
        </div>
      `;
      break;

    case 'shipped':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Your Handloom Parcel Has Shipped! 📦</h2>
        <p style="color: #44403C; line-height: 1.6;">Order #${order_number} is packed in tamper-proof cloth packaging and dispatched via <strong>${payload.courierName || 'Express Courier'}</strong>.</p>
        <div style="background-color: #F5F5F4; padding: 14px 18px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Courier:</strong> ${payload.courierName || 'BlueDart Express'}</p>
          <p style="margin: 0 0 6px 0;"><strong>Tracking ID / AWB:</strong> <code style="font-family: monospace; font-size: 14px; font-weight: bold;">${payload.trackingId || 'In Transit'}</code></p>
          ${payload.estimatedDelivery ? `<p style="margin: 0;"><strong>Estimated Delivery:</strong> ${payload.estimatedDelivery}</p>` : ''}
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.trackingUrl || trackingUrl}" style="background-color: #881337; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Track Courier Shipment →</a>
        </div>
      `;
      break;

    case 'delivered':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Your Nirai Handloom Has Been Delivered! ✨</h2>
        <p style="color: #44403C; line-height: 1.6;">Order #${order_number} has been marked as delivered by our courier partner. We hope your handloom piece brings elegance and tradition to your special moments.</p>
        <p style="color: #44403C; line-height: 1.6;">Please inspect your saree. In case of any issues, our 7-day exchange window is active.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${appUrl}/account" style="background-color: #881337; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Leave a Review</a>
        </div>
      `;
      break;

    case 'cancelled':
      bodyContent = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">Order #${order_number} Cancelled</h2>
        <p style="color: #44403C; line-height: 1.6;">Order #${order_number} has been cancelled per your request or store policy.</p>
      `;
      break;

    case 'admin_payment_pending':
      bodyContent = `
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #92400E; font-family: Georgia, serif; margin: 0 0 6px 0;">[Admin Alert] New Payment Proof Awaiting Verification</h2>
          <p style="color: #B45309; margin: 0; font-size: 13px;">Order #${order_number} has received an offline payment submission.</p>
        </div>
        <div style="background-color: #F5F5F4; padding: 14px 18px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Order:</strong> #${order_number}</p>
          <p style="margin: 0 0 6px 0;"><strong>Amount Paid:</strong> ₹${Number(payload.amount_paid || 0).toLocaleString()}</p>
          <p style="margin: 0 0 6px 0;"><strong>Method:</strong> ${(payload.method || 'upi').toUpperCase()}</p>
          <p style="margin: 0 0 6px 0;"><strong>UTR:</strong> <code style="font-family: monospace; font-size: 13px; font-weight: bold;">${payload.utr || 'N/A'}</code></p>
          <p style="margin: 0;"><strong>Payer Name:</strong> ${payload.payer_name || 'N/A'}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${adminVerifyUrl}" style="background-color: #881337; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">Open Verification Queue →</a>
        </div>
      `;
      break;

    default:
      bodyContent = `<p>Notification update for Order #${order_number}.</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 20px; background-color: #EDE8DE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
          ${header}
          <div style="padding: 28px 24px;">
            ${bodyContent}
          </div>
          ${footer}
        </div>
      </body>
    </html>
  `;
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
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';

    // 1. Caller Authentication (Requirement C)
    const incomingSecret = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization') || '';
    const isServiceRole = Boolean(supabaseServiceKey && authHeader === `Bearer ${supabaseServiceKey}`);
    const isSecretValid = Boolean(expectedSecret && incomingSecret === expectedSecret);

    if (!isServiceRole && !isSecretValid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid x-webhook-secret header or service role token' }),
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

    // 2. Fetch up to 20 pending notifications from notifications_outbox
    const { data: outboxRows, error: fetchError } = await supabase
      .from('notifications_outbox')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error('[send-notifications] Database fetch error:', fetchError.message);
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rows: NotificationRow[] = outboxRows || [];
    let sentCount = 0;
    let failedCount = 0;

    // 3. Process each notification
    for (const row of rows) {
      const emailHtml = buildEmailHtml(row.event_type, row.order_number, row.payload || {}, appUrl);

      let sendSuccess = false;
      let errorMsg: string | null = null;

      if (resendApiKey) {
        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: notifyFromEmail,
              to: row.recipient_email,
              subject: row.subject,
              html: emailHtml,
            }),
          });

          if (!resendResponse.ok) {
            const errData = await resendResponse.json().catch(() => ({}));
            errorMsg = errData.message || `Resend HTTP ${resendResponse.status}`;
          } else {
            sendSuccess = true;
          }
        } catch (netErr: any) {
          errorMsg = netErr?.message || 'Network error communicating with Resend';
        }
      } else {
        // Mock mode when RESEND_API_KEY is not yet configured
        sendSuccess = true;
      }

      // 4. Update status in notifications_outbox
      if (sendSuccess) {
        await supabase
          .from('notifications_outbox')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            attempts: row.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        sentCount++;
        // Requirement C: NEVER log recipient email or personal data!
        console.log(`[send-notifications] Sent notification id=${row.id} event=${row.event_type} order=${row.order_number.slice(0, 5)}***`);
      } else {
        await supabase
          .from('notifications_outbox')
          .update({
            status: 'failed',
            error_message: errorMsg,
            attempts: row.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        failedCount++;
        // Requirement C: Sanitized log without email
        console.error(`[send-notifications] Failed notification id=${row.id} event=${row.event_type} error=${errorMsg}`);
      }
    }

    // Requirement C: Return aggregate counts WITHOUT exposing recipient data
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
    console.error('[send-notifications] Unexpected error:', err?.message || err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
