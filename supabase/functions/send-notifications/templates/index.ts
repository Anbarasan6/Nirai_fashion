// Transactional Email Templates for Nirai (English & Tamil)
// Mobile-responsive, brand-styled, with HTML sanitization & plain-text fallbacks.

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface TemplateParams {
  orderNumber: string;
  payload: Record<string, any>;
  locale?: 'en' | 'ta';
  siteUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND_COLOR = '#2D1619';
const GOLD_COLOR = '#D4AF37';

function renderItemsTable(items: any[]): { html: string; text: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { html: '', text: '' };
  }

  let htmlRows = '';
  let textRows = '';

  for (const item of items) {
    const title = escapeHtml(item.product_title || item.title || 'Handloom Item');
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || item.unit_price || 0);
    const lineTotal = qty * price;

    htmlRows += `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E7E5E4; font-size: 13px; color: #1C1917;">${title}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E7E5E4; font-size: 13px; color: #57534E; text-align: center;">${qty}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #E7E5E4; font-size: 13px; color: #1C1917; text-align: right; font-weight: 600;">₹${lineTotal.toLocaleString('en-IN')}</td>
      </tr>
    `;
    textRows += `- ${title} x ${qty} = ₹${lineTotal.toLocaleString('en-IN')}\n`;
  }

  const html = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #FAF8F5; border-radius: 6px; overflow: hidden; border: 1px solid #E7E5E4;">
      <thead>
        <tr style="background-color: #F5EFEB; text-align: left; font-size: 11px; text-transform: uppercase; color: #78716C; letter-spacing: 0.5px;">
          <th style="padding: 10px 12px;">Item</th>
          <th style="padding: 10px 12px; text-align: center;">Qty</th>
          <th style="padding: 10px 12px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
  `;

  return { html, text: `\nOrder Summary:\n${textRows}\n` };
}

function wrapLayout(contentHtml: string, title: string, siteUrl: string, locale: 'en' | 'ta'): string {
  const isTa = locale === 'ta';
  const tagline = isTa ? 'பாரம்பரிய தென்னிந்திய கைத்தறி' : 'Authentic South Indian Handloom';
  const supportText = isTa
    ? `ஆர்டர் உதவிக்கு தொடர்பு கொள்க: <a href="mailto:care@nirai.in" style="color: #881337;">care@nirai.in</a> | வாட்ஸ்அப்: +91 94432 11098`
    : `Need assistance? Contact our artisan desk at <a href="mailto:care@nirai.in" style="color: #881337;">care@nirai.in</a> or WhatsApp: +91 94432 11098`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #EDE8DE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: ${BRAND_COLOR}; padding: 24px; text-align: center;">
            <h1 style="color: #FAF6F0; margin: 0; font-family: Georgia, serif; font-size: 24px; letter-spacing: 2px;">NIRAI · நிறை</h1>
            <p style="color: ${GOLD_COLOR}; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">${tagline}</p>
          </div>

          <!-- Body -->
          <div style="padding: 28px 24px;">
            ${contentHtml}
          </div>

          <!-- Footer -->
          <div style="background-color: #F8F6F0; padding: 20px; text-align: center; font-size: 12px; color: #78716C; border-top: 1px solid #E7E5E4;">
            <p style="margin: 0 0 8px 0;">${supportText}</p>
            <p style="margin: 0; font-size: 11px; color: #A8A29E;">© ${new Date().getFullYear()} Nirai Traditional Ethnic Apparel. 10 Cathedral Road, Chennai, Tamil Nadu - 600086.</p>
          </div>

        </div>
      </body>
    </html>
  `;
}

export function renderEmail(type: string, params: TemplateParams): RenderedEmail {
  const { orderNumber, payload, locale = 'en', siteUrl } = params;
  const isTa = locale === 'ta';
  const safeOrder = escapeHtml(orderNumber);
  const safeName = escapeHtml(payload.customer_name || 'Valued Customer');
  const payUrl = `${siteUrl}/pay/${encodeURIComponent(orderNumber)}`;
  const trackingUrl = payload.trackingUrl || `${siteUrl}/tracking/${encodeURIComponent(orderNumber)}`;
  const adminVerifyUrl = `${siteUrl}/admin/orders?tab=payments`;
  const grandTotal = Number(payload.grand_total || 0).toLocaleString('en-IN');
  const itemsRender = renderItemsTable(payload.items || []);

  let subject = '';
  let bodyHtml = '';
  let text = '';

  switch (type) {
    case 'order_placed':
      subject = isTa
        ? `ஆர்டர் #${safeOrder} பெறப்பட்டது | நிறை கைத்தறி`
        : `Order #${safeOrder} Received | Nirai Handlooms`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? `வணக்கம் ${safeName}! உங்கள் ஆர்டர் பெறப்பட்டது` : `Vanakkam ${safeName}! Your Order is Received`}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `தென்னிந்திய கைத்தறி நெசவு பாரம்பரியத்தை ஆதரித்ததற்கு நன்றி. உங்கள் கைத்தறி ஆடை ஒதுக்கப்பட்டு 24 மணி நேரம் இருப்பு வைக்கப்பட்டுள்ளது.`
            : `Thank you for patronizing authentic South Indian handlooms. We have reserved your woven pieces in our inventory.`
          }
        </p>
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 14px 18px; border-radius: 6px; margin: 18px 0;">
          <p style="margin: 0; color: #92400E; font-weight: bold; font-size: 15px;">
            ${isTa ? 'செலுத்த வேண்டிய தொகை' : 'Amount Due'}: ₹${grandTotal}
          </p>
          <p style="margin: 6px 0 0 0; color: #B45309; font-size: 12px;">
            ${isTa ? 'கட்டணம் செலுத்தும் அவகாசம்: 24 மணி நேரம்' : 'Payment Window: 24 Hours. UPI QR & Bank Transfer Available.'}
          </p>
        </div>
        ${itemsRender.html}
        <div style="text-align: center; margin: 28px 0;">
          <a href="${payUrl}" style="background-color: #881337; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
            ${isTa ? 'இப்போதே பணம் செலுத்தி ரசீதை சமர்ப்பிக்கவும் →' : 'Pay Now &amp; Submit Proof →'}
          </a>
        </div>
      `;
      text = `${isTa ? 'வணக்கம்' : 'Vanakkam'} ${safeName}!\n\nOrder #${orderNumber} total: ₹${grandTotal}.\nPay and submit proof at: ${payUrl}\n${itemsRender.text}`;
      break;

    case 'payment_proof_received':
      subject = isTa
        ? `கட்டண ரசீது பெறப்பட்டது - ஆர்டர் #${safeOrder}`
        : `Payment Proof Received for #${safeOrder}`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? 'கட்டண ரசீது பதிவு செய்யப்பட்டது' : 'Payment Proof Received'}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `உங்கள் 12 இலக்க UTR எண் (<strong>${escapeHtml(payload.utr || 'பதிவு செய்யப்பட்டது')}</strong>) சரிபார்ப்பிற்கு அனுப்பப்பட்டுள்ளது.`
            : `We received your payment reference (<strong>UTR: ${escapeHtml(payload.utr || 'Submitted')}</strong>, Amount: ₹${grandTotal}).`
          }
        </p>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `எங்கள் கணக்கு பிரிவு உங்கள் பரிவர்த்தனையை 2 முதல் 4 வணிக மணிநேரத்திற்குள் சரிபார்த்து உறுதி செய்யும்.`
            : `Our accounting team verifies bank and UPI credits against merchant records within <strong>2 to 4 business hours</strong>.`
          }
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="background-color: #44403C; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            ${isTa ? 'ஆர்டர் நிலையை கண்காணிக்க' : 'Track Status'}
          </a>
        </div>
      `;
      text = `Payment proof received for Order #${orderNumber} (UTR: ${payload.utr || 'N/A'}). Status updates available at: ${trackingUrl}`;
      break;

    case 'payment_verified':
      subject = isTa
        ? `✓ கட்டணம் உறுதியானது! ஆர்டர் #${safeOrder} தயார் செய்யப்படுகிறது`
        : `✓ Payment Verified & Order Confirmed #${safeOrder}`;
      bodyHtml = `
        <div style="background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #065F46; font-family: Georgia, serif; margin: 0 0 6px 0;">
            ${isTa ? '✓ கட்டணம் சரிபார்க்கப்பட்டு ஆர்டர் உறுதியானது!' : '✓ Payment Verified &amp; Order Confirmed!'}
          </h2>
          <p style="color: #047857; margin: 0; font-size: 13px;">
            ${isTa ? `ஆர்டர் #${safeOrder} கட்டணம் வெற்றிகரமாக ஏற்றுக்கொள்ளப்பட்டது.` : `Your offline payment for Order #${safeOrder} has cleared.`}
          </p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `எங்கள் நெசவாளர்கள் உங்கள் கைத்தறி புடவைகளை கவனமாக பேக் செய்து அனுப்ப தயார் செய்து வருகின்றனர். கூரியர் அனுப்பப்பட்டதும் கண்காணிப்பு எண் பகிரப்படும்.`
            : `Our fulfillment team is preparing your authentic handloom pieces for dispatch. You will receive an AWB tracking number upon handover.`
          }
        </p>
        ${itemsRender.html}
        <div style="text-align: center; margin: 24px 0;">
          <a href="${trackingUrl}" style="background-color: #047857; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            ${isTa ? 'ஆர்டர் நிலை பார்க்க' : 'View Order Progress'}
          </a>
        </div>
      `;
      text = `Payment verified for Order #${orderNumber}! We are preparing your handloom items for dispatch. Track: ${trackingUrl}`;
      break;

    case 'payment_rejected':
      const reason = escapeHtml(payload.reject_reason || 'UTR could not be matched with bank statements');
      subject = isTa
        ? `கட்டண சரிபார்ப்பு தகவல் - ஆர்டர் #${safeOrder}`
        : `Payment Verification Update for #${safeOrder}`;
      bodyHtml = `
        <div style="background-color: #FFF1F2; border: 1px solid #FECDD3; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #9F1239; font-family: Georgia, serif; margin: 0 0 6px 0;">
            ${isTa ? 'கட்டண சரிபார்ப்பில் சிக்கல் உள்ளது' : 'Unable to Verify Payment Reference'}
          </h2>
          <p style="color: #BE123C; margin: 0; font-size: 13px;">
            ${isTa ? `ஆர்டர் #${safeOrder} சமர்ப்பிக்கப்பட்ட UTR எண்ணில் வங்கி வரவு காணப்படவில்லை.` : `We could not match the UTR reference for Order #${safeOrder}.`}
          </p>
        </div>
        <div style="background-color: #F5F5F4; padding: 12px 16px; border-radius: 6px; border-left: 4px solid #E11D48; margin: 16px 0;">
          <p style="margin: 0; color: #44403C; font-size: 13px;"><strong>${isTa ? 'காரணம்' : 'Reason'}:</strong> ${reason}</p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `உங்கள் வங்கி அறிக்கை அல்லது UPI செயலியை சரிபார்த்து சரியான 12 இலக்க UTR எண்ணை மீண்டும் சமர்ப்பிக்கவும். உங்கள் கைத்தறி ஆடை இன்னும் இருப்பு வைக்கப்பட்டுள்ளது.`
            : `Don't worry — your handloom order is still reserved until the payment window expires. Please verify your transaction receipt and resubmit your reference:`
          }
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payUrl}" style="background-color: #E11D48; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            ${isTa ? 'சரியான UTR எண்ணை சமர்ப்பிக்க →' : 'Resubmit Correct UTR →'}
          </a>
        </div>
      `;
      text = `Payment verification update for Order #${orderNumber}. Reason: ${payload.reject_reason || 'N/A'}. Resubmit here: ${payUrl}`;
      break;

    case 'payment_reminder':
      subject = isTa
        ? `⚠️ நினைவூட்டல்: ஆர்டர் #${safeOrder} கட்டணம் செலுத்த 4 மணி நேரம் மட்டுமே உள்ளது`
        : `⚠️ Urgent Reminder: 4 Hours Left for Order #${safeOrder}`;
      bodyHtml = `
        <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #92400E; font-family: Georgia, serif; margin: 0 0 6px 0;">
            ${isTa ? '⚠️ கட்டண அவகாசம் விரைவில் முடிகிறது' : '⚠️ Payment Deadline Approaching'}
          </h2>
          <p style="color: #B45309; margin: 0; font-size: 13px;">
            ${isTa ? `ஆர்டர் #${safeOrder} க்கான கட்டண அவகாசம் இன்னும் 4 மணி நேரத்தில் முடிவடைகிறது.` : `Your reservation for Order #${safeOrder} expires in approximately 4 hours.`}
          </p>
        </div>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `கைத்தறி ஆடைகள் குறைவாக இருப்பதால், அவகாசம் முடிந்ததும் ஆர்டர் தானாக ரத்து செய்யப்பட்டு மற்ற வாடிக்கையாளர்களுக்கு கிடைக்கும். தாமதமின்றி கட்டணம் செலுத்தவும்.`
            : `To retain your handloom weave and prevent automatic cancellation, please complete your UPI/bank transfer and submit your proof:`
          }
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payUrl}" style="background-color: #B45309; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            ${isTa ? 'இப்போதே கட்டணம் செலுத்த →' : 'Complete Payment Now →'}
          </a>
        </div>
      `;
      text = `Payment reminder: 4 hours left to complete payment for Order #${orderNumber}. Pay here: ${payUrl}`;
      break;

    case 'order_expired':
      subject = isTa
        ? `ஆர்டர் #${safeOrder} கட்டண அவகாசம் முடிவடைந்தது`
        : `Order #${safeOrder} Payment Window Expired`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? 'ஆர்டர் ரத்து செய்யப்பட்டது' : `Order #${safeOrder} Expired`}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `ஆர்டர் #${safeOrder} க்கான கட்டணம் அவகாசத்திற்குள் பெறப்படாததால், கைத்தறி ஆடைகள் மீண்டும் விற்பனைக்கு வைக்கப்பட்டுள்ளன.`
            : `The payment deadline for Order #${safeOrder} has concluded without a verified transfer. The handloom pieces have been released back to public inventory.`
          }
        </p>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `நீங்கள் ஏற்கனவே பணம் செலுத்தியிருந்தால், உங்கள் ரசீதுடன் care@nirai.in என்ற மின்னஞ்சலில் தொடர்பு கொள்ளவும்.`
            : `If you already transferred funds, please email our support team at care@nirai.in with your transaction screenshot.`
          }
        </p>
      `;
      text = `Order #${orderNumber} payment deadline expired. If you already transferred funds, contact care@nirai.in.`;
      break;

    case 'shipped':
      const courier = escapeHtml(payload.courierName || 'Express Courier');
      const awb = escapeHtml(payload.trackingId || 'In Transit');
      subject = isTa
        ? `ஆர்டர் #${safeOrder} அனுப்பப்பட்டது 📦`
        : `Order #${safeOrder} Shipped 📦`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? 'உங்கள் கைத்தறி ஆடை புறப்பட்டுவிட்டது!' : 'Your Handloom Parcel Has Shipped!'}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `ஆர்டர் #${safeOrder} கவனமாக பேக் செய்யப்பட்டு <strong>${courier}</strong> மூலம் அனுப்பப்பட்டுள்ளது.`
            : `Order #${safeOrder} is safely packaged and dispatched via <strong>${courier}</strong>.`
          }
        </p>
        <div style="background-color: #F5F5F4; padding: 14px 18px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>${isTa ? 'கூரியர்' : 'Courier'}:</strong> ${courier}</p>
          <p style="margin: 0;"><strong>AWB / Tracking:</strong> <code style="font-family: monospace; font-weight: bold;">${awb}</code></p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${payload.trackingUrl || trackingUrl}" style="background-color: #881337; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            ${isTa ? 'கூரியர் கண்காணிப்பு →' : 'Track Shipment →'}
          </a>
        </div>
      `;
      text = `Order #${orderNumber} has shipped via ${courier} (AWB: ${awb}). Track here: ${payload.trackingUrl || trackingUrl}`;
      break;

    case 'delivered':
      subject = isTa
        ? `ஆர்டர் #${safeOrder} டெலிவரி செய்யப்பட்டது ✨`
        : `Order #${safeOrder} Delivered ✨`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? 'நிறை கைத்தறி டெலிவரி செய்யப்பட்டது!' : 'Delivered! Enjoy Your Handloom Piece'}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa
            ? `ஆர்டர் #${safeOrder} வெற்றிகரமாக டெலிவரி செய்யப்பட்டது. உங்கள் கைத்தறி ஆடை உங்கள் சிறப்புத் தருணங்களில் நல்வாய்ப்பை சேர்க்க வாழ்த்துகிறோம்.`
            : `Order #${safeOrder} has been delivered. We hope our handloom weaves bring joy and grace to your special occasions.`
          }
        </p>
      `;
      text = `Order #${orderNumber} delivered. Thank you for choosing Nirai Handlooms!`;
      break;

    case 'cancelled':
      subject = isTa ? `ஆர்டர் #${safeOrder} ரத்து செய்யப்பட்டது` : `Order #${safeOrder} Cancelled`;
      bodyHtml = `
        <h2 style="color: #1C1917; font-family: Georgia, serif; margin-top: 0;">
          ${isTa ? 'ஆர்டர் ரத்து செய்யப்பட்டது' : `Order #${safeOrder} Cancelled`}
        </h2>
        <p style="color: #44403C; line-height: 1.6;">
          ${isTa ? `ஆர்டர் #${safeOrder} ரத்து செய்யப்பட்டுள்ளது.` : `Order #${safeOrder} has been cancelled.`}
        </p>
      `;
      text = `Order #${orderNumber} has been cancelled.`;
      break;

    case 'admin_payment_pending':
      subject = `[Admin Alert] New Payment Proof Awaiting Verification #${safeOrder}`;
      bodyHtml = `
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h2 style="color: #92400E; font-family: Georgia, serif; margin: 0 0 6px 0;">[Admin Alert] New Payment Proof Received</h2>
          <p style="color: #B45309; margin: 0; font-size: 13px;">Customer submitted payment proof for Order #${safeOrder}.</p>
        </div>
        <div style="background-color: #F5F5F4; padding: 14px 18px; border-radius: 6px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 0 0 6px 0;"><strong>Order:</strong> #${safeOrder}</p>
          <p style="margin: 0 0 6px 0;"><strong>Amount Paid:</strong> ₹${Number(payload.amount_paid || 0).toLocaleString('en-IN')}</p>
          <p style="margin: 0 0 6px 0;"><strong>Method:</strong> ${escapeHtml((payload.method || payload.payment_method || 'UPI').toUpperCase())}</p>
          <p style="margin: 0 0 6px 0;"><strong>UTR:</strong> <code style="font-family: monospace; font-weight: bold;">${escapeHtml(payload.utr || 'N/A')}</code></p>
          <p style="margin: 0;"><strong>Payer:</strong> ${escapeHtml(payload.payer_name || 'N/A')}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${adminVerifyUrl}" style="background-color: #881337; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 13px;">
            Open Verification Queue →
          </a>
        </div>
      `;
      text = `[Admin Alert] New Payment Proof for Order #${orderNumber}.\nAmount: ₹${payload.amount_paid}\nUTR: ${payload.utr}\nVerify: ${adminVerifyUrl}`;
      break;

    default:
      subject = `Order Update #${safeOrder}`;
      bodyHtml = `<p>Notification update for Order #${safeOrder}.</p>`;
      text = `Notification update for Order #${orderNumber}.`;
  }

  const wrappedHtml = wrapLayout(bodyHtml, subject, siteUrl, locale);
  return { subject, html: wrappedHtml, text };
}
