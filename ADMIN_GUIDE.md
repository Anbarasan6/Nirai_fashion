# Nirai (நிறை) — Administrator & Operations Guide

## Offline Payment Verification & Reconciliation Manual

> **Security Mandate**: Nirai does not use an automated third-party payment gateway. All customer payments are made via direct dynamic UPI QR code, VPA transfer, or NEFT/IMPS bank transfer, followed by proof submission (UTR reference number and receipt image).  
> **Golden Rule**: Customer submission of a UTR or screenshot **NEVER** marks an order as paid. An order can only transition to `Paid` after staff or an administrator verifies the transaction against the store's merchant bank or UPI statement.

---

## 1. Daily Verification Routine (Step-by-Step)

Staff and administrators should run this verification cycle multiple times daily (e.g., morning 9:00 AM, afternoon 2:00 PM, evening 7:00 PM):

### Step 1: Open the Payment Verification Queue
1. Log in to the Nirai Operations Console at `/admin/orders`.
2. Notice the badge counter in the left sidebar next to **Orders & Fulfillment** indicating offline submissions awaiting manual review.
3. Click the **Payment Verification** tab.  
   - Submissions are listed in **oldest-first** order to ensure customers who paid first are served promptly.

### Step 2: Open Merchant Bank Account & UPI Business Statement
- Log in to your merchant bank portal (e.g., HDFC NetBanking) or UPI Merchant App (e.g., Google Pay for Business, PhonePe Business).
- Filter transactions for the date range corresponding to the submission.

### Step 3: Match the UTR & Amount
Open the order by clicking **Manage**:
1. **UTR Reference #**: Match the customer's 12-digit UPI UTR or bank reference string against the statement credit record.
2. **Amount Paid vs Expected Total**:
   - Verify that the amount credited equals the order's **Server Expected Total**.
   - If there is an amount mismatch, a warning banner will appear. **Do not approve an underpaid order.**
3. **Payer Name**: Check that the payer name matches or correlates with the customer or submission notes.
4. **Receipt Screenshot**: Click the thumbnail to open the full-resolution signed receipt URL in a new tab. Verify timestamp, bank logo, and transaction status: "SUCCESS / COMPLETED".
5. **Duplicate Check**: The system automatically verifies that the normalized UTR is unique among non-rejected submissions. If an alert reads `🚨 DUPLICATE UTR DETECTED`, investigate immediately before proceeding.

### Step 4: Approve or Reject

#### To Approve (Verify):
1. Click **Verify & Confirm Order**.
2. A confirmation prompt will ask you to confirm that you have checked the bank statement.
3. Click **OK**.
4. The system executes the atomic database RPC `verify_payment(submission_id)`:
   - Sets order fulfillment status to `'Confirmed'`.
   - Sets payment status to `'Paid'`.
   - Writes an immutable record to `order_audit_log` with your administrator UID.
   - The order moves into the fulfillment queue for packing and dispatch.

#### To Reject:
1. If the UTR does not exist in your statement, is short on amount, or the receipt is illegible, click **Reject Proof**.
2. In the modal, provide a **clear, specific reason** (minimum 5 characters, e.g., *"UTR 429188201948 not reflected in HDFC statement as of 3:00 PM. Please verify transaction ID or contact your bank."*).
3. Click **Confirm Rejection**.
4. The system executes `reject_payment(submission_id, reason)`:
   - Sets payment status to `'Rejected'`.
   - Keeps the stock hold active until the order payment deadline (`payment_due_at`).
   - Customer immediately sees the rejection reason on `/pay/:orderNumber` and `/tracking`, with a button to re-submit corrected proof.

---

## 2. Order Payment Lifecycle & States

| Payment Status | Description | Action Required |
|---|---|---|
| `Awaiting Payment` | Order placed, stock held. Customer has not yet submitted proof. | Awaiting customer transfer. |
| `Verification Pending` | Customer submitted UTR / receipt. Order appears in admin queue. | **Staff must verify against bank statement.** |
| `Paid` | Staff verified credit in bank statement, or Admin marked paid manually. | Proceed with weaving inspection, packing, and courier dispatch. |
| `Rejected` | Proof was rejected by staff. Stock remains held until deadline. | Customer can re-submit proof before deadline. |
| `Expired` | Payment deadline passed without verified payment. | System automatically cancelled order and restored stock to inventory. |
| `Refunded` | Payment was refunded to customer. | Logged in audit trail. |

> **Critical Safety**: Non-admins cannot directly alter payment status via form inputs. All status updates must go through server-side RPCs (`verify_payment`, `reject_payment`, `mark_order_paid_manually`).

---

## 3. Order Expiry & Automated Stock Restoration

- **Payment Deadline**: Default is **24 hours** from order placement (configurable in **Settings > Payment**).
- **Scheduled Expiry**: An automated database procedure `expire_unpaid_orders()` runs periodically (every 15 minutes via Edge Function or pg_cron).
- **Rules**:
  - Orders still in `'Awaiting Payment'` or `'Rejected'` past `payment_due_at` are changed to `status: 'Cancelled'` and `payment_status: 'Expired'`.
  - Reserved stock for each item is restored to product inventory and recorded in `stock_movements`.
  - **Orders in `'Verification Pending'` are NEVER auto-expired.** As long as a customer submitted proof, their stock hold is protected until a staff member reviews it.

---

## 4. Manual Payments (Cash / Counter / Offline Walk-ins)

If a customer pays in physical cash (e.g., at the boutique showroom) or via direct offline bank deposit without using the portal:
1. Open the order in **OrderManager**.
2. As a `super_admin` or `admin`, scroll to the bottom of the Payment Verification card.
3. Click **Mark Paid Manually (Admin Override)**.
4. Enter a mandatory audit note explaining the collection (e.g., *"Cash collected at Chennai showroom counter by Operations Manager"*).
5. Confirm. The order transitions directly to `'Paid'` and `'Confirmed'`, logged in `order_audit_log`.

---

## 5. Editing Payment Settings & Bank Details

To modify the store's UPI VPA, QR code, bank details, or deadline:
1. Go to **Settings & Content** (`/admin/content`).
2. In Section 1 (**Merchant Payment Gateway, UPI QR Code & Bank Account Setup**):
   - **UPI VPA ID**: Must follow `name@bank` format (e.g. `nirai@upi`).
   - **Bank Account Number**: 8 to 18 digits. Full number visible here; masked to last 4 digits in customer and list views.
   - **IFSC Code**: 11 alphanumeric characters (e.g. `HDFC0001244`).
   - **Static QR Image**: Upload a high-resolution QR image directly to the public-read `payment-qr` storage bucket.
   - **Payment Deadline (Hours)**: Default 24 hours.
   - **Cash on Delivery (COD)**: Toggle on/off according to store policy.
3. Check the **Live Customer Checkout Preview** at the bottom of the section to verify formatting.
4. Click **Publish Settings**. Changes take effect instantly for all subsequent checkouts.

---

## 6. Troubleshooting & FAQs

### Q1: Customer claims they paid, but UTR does not appear on statement.
- **Cause**: Inter-bank UPI settlement delays (especially during bank maintenance hours, 11:30 PM to 2:00 AM).
- **Action**: Do not reject immediately if deadline is still far. Wait 30–60 minutes and refresh statement. If still not reflected after 2 hours, reject with reason: *"UTR not reflected in merchant statement. Please check your UPI app or bank statement for a 12-digit transaction reference."*

### Q2: Duplicate UTR warning appeared.
- **Cause**: Customer accidentally submitted the same UTR for two different orders, or attempted to reuse an old receipt.
- **Action**: The system enforces database uniqueness on all non-rejected UTRs. Check the order number referenced in the warning banner. If legitimate (e.g. customer combined two orders into one payment), mark the second order manually with a clear note referencing the first order.

### Q3: Customer cannot upload receipt screenshot.
- **Rules**: Max file size is 2 MB. Accepted formats: JPG, PNG, WebP.
- **Fallback**: Customer can submit just the 12-digit UTR text without screenshot. Staff can verify directly using the UTR on their bank statement.
