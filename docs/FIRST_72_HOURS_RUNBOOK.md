# First 72 Hours Production Runbook

---

## 1. Operational Cadence & Verification Schedule

| Time Window (IST) | Frequency | Responsible Role | Primary Tasks |
| :--- | :--- | :--- | :--- |
| **08:00 AM – 09:00 AM** | Morning Opening Sweep | Lead Admin / Operations | Check overnight orders, verify pending UTRs, inspect outbox failure count. |
| **09:00 AM – 08:00 PM** | **Every 15–30 Minutes** | Order Processing Staff | Monitor `/admin/orders?tab=payments`. Reconcile incoming bank/UPI alerts with pending UTRs. |
| **08:00 PM – 11:00 PM** | Every 45 Minutes | Night Shift Admin | Final batch verification for same-day dispatch packaging. |
| **11:00 PM – 08:00 AM** | Automated Hourly | `pg_cron` Expiry Job | Automated cancellation of orders exceeding 24h payment window; inventory restocked. |

---

## 2. Exception Handling Runbooks

### Incident 1: Customer Paid but Has No Order
**Symptom**: Customer claims they transferred money via UPI, but received no order confirmation and `/pay` link doesn't show their order.
1. Ask customer for:
   - 12-digit UPI Reference / UTR
   - Screenshot of payment success from GPay/PhonePe
   - Phone number used
2. Verify in your bank account / merchant UPI statement that funds were actually credited.
3. Search `public.orders` by customer phone or email:
   ```sql
   SELECT * FROM public.orders WHERE customer_phone = '9876543210';
   ```
4. If no order exists (customer closed browser before `place_order` completed):
   - In `/admin/orders`, create an assisted manual order with the chosen product.
   - Manually link the UTR in `payment_submissions`.
   - Send order confirmation email and WhatsApp message to the customer.

---

### Incident 2: Double Payment
**Symptom**: Customer accidentally paid twice or submitted two distinct UTRs for the same order.
1. Check merchant bank statement to confirm **two separate credits** were received.
2. Approve the first submission to transition order to `Confirmed / Paid`.
3. For the duplicate credit:
   - Initiate immediate refund to customer's UPI VPA from your merchant banking portal.
   - Note the refund UTR in `/admin/orders` internal notes and `order_audit_log`.
   - Notify customer: *"We noticed a duplicate payment for Order #NIRAI-... Excess amount of ₹... has been refunded to your source UPI account. Refund Ref: ..."*

---

### Incident 3: Short or Wrong Amount Paid
**Symptom**: Order total was ₹4,500, but customer transferred ₹4,000.
1. In `/admin/orders?tab=payments`, click **Reject Payment**.
2. Select reason: **Amount Mismatch / Short Payment**.
3. Specify exact detail: *"Received ₹4,000 instead of ₹4,500. Please pay remaining ₹500 using the link below."*
4. System automatically emails the customer with the rejection notice and payment resubmit link.

---

### Incident 4: Stock Mismatch (Concurrency Oversell)
**Symptom**: Two customers placed orders for the last unique handloom saree within seconds of each other.
1. Identify the second order chronologically.
2. Phone the customer within 30 minutes:
   - Explain that pure handloom sarees are woven in single pieces and an overlap occurred.
   - Offer an alternative handloom piece of equal or slightly higher value with complimentary shipping.
   - If customer declines, execute an **immediate 100% UPI refund** within 1 hour.

---

## 3. Emergency Checkout Killswitch (Maintenance Mode)

If fraud is detected, inventory data is corrupted, or payment gateway needs emergency re-keying:

### Option A: Via Admin Portal (Fastest)
1. Open `/admin/content`.
2. Locate the top card: **Emergency Maintenance Mode & Checkout Killswitch**.
3. Toggle the switch to **Checkout Disabled**.
4. Click **Publish All Settings**.
5. The storefront will immediately show the maintenance banner on Checkout and block order placements.

### Option B: Via Direct SQL Emergency Command
```sql
UPDATE public.settings 
SET checkout_enabled = false,
    maintenance_message_en = 'Store checkout is temporarily paused for scheduled maintenance. We will resume taking orders shortly.',
    maintenance_message_ta = 'பராமரிப்பு பணி காரணமாக செக்அவுட் தற்காலிகமாக நிறுத்தப்பட்டுள்ளது. விரைவில் மீண்டும் தொடங்கப்படும்.';
```
