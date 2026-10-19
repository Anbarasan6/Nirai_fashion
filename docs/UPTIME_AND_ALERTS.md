# Uptime & Operational Monitoring Alerts Guide

---

## 1. Lightweight Health Check Endpoint

- **URL**: `https://nirai.in/api/health`
- **Response**: `200 OK` with JSON `{"status": "healthy", "timestamp": "..."}`
- **Degraded**: `503 Service Unavailable` if database check fails or times out.
- **Tools**: Setup a free monitor on [UptimeRobot](https://uptimerobot.com) or [BetterStack](https://betterstack.com) checking `https://nirai.in/api/health` every 1 to 3 minutes with SMS/Email notifications.

---

## 2. The 5 Core Production Alerts

Configure the following 5 alerts across UptimeRobot, Supabase SQL Alerts, and Sentry:

### Alert 1: Storefront / API Downtime (Critical P0)
- **Tool**: UptimeRobot / BetterStack
- **Target**: `https://nirai.in/api/health`
- **Threshold**: 2 consecutive failed health checks (or HTTP 503 / timeout > 2s).
- **Notification**: Instant SMS, WhatsApp, and High-Priority Email to Store Admin.

### Alert 2: Failed Transactional Notifications (P1)
- **Tool**: Supabase SQL Alert / Scheduled Edge Function
- **Query**:
  ```sql
  SELECT count(*) FROM public.notifications_outbox 
  WHERE status = 'failed' AND attempts >= 5 AND created_at > now() - interval '24 hours';
  ```
- **Threshold**: Count > 0.
- **Meaning**: Customer order confirmations or payment receipts are failing to deliver (e.g. Resend bounce, invalid recipient, domain unverified).

### Alert 3: Stale Payment Verification Queue (P1)
- **Tool**: Supabase SQL Alert / Daily Morning Report
- **Query**:
  ```sql
  SELECT count(*) FROM public.orders 
  WHERE payment_status = 'Verification Pending' AND created_at < now() - interval '24 hours';
  ```
- **Threshold**: Count > 0.
- **Meaning**: A customer has submitted payment proof but the store staff has not verified or rejected it within 24 hours.

### Alert 4: Expiry Job Missed / Stuck (P2)
- **Tool**: Supabase Cron Monitor
- **Query**:
  ```sql
  SELECT count(*) FROM public.orders 
  WHERE status = 'Pending' 
    AND payment_status = 'Awaiting Payment' 
    AND payment_due_at < now() - interval '1 hour';
  ```
- **Threshold**: Count > 0.
- **Meaning**: The automated hourly order expiry job (`expire_unpaid_orders`) failed to run, causing inventory to remain reserved for abandoned orders.

### Alert 5: Sentry Frontend Error Spike (P1)
- **Tool**: Sentry Alert Rule
- **Condition**: Number of unhandled frontend errors exceeds 10 events within 15 minutes.
- **Action**: Alert via Email/Slack to engineering team with link to the Sentry issue and scrubbed error context.
