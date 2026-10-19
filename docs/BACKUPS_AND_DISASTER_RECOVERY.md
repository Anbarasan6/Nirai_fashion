# Backups & Disaster Recovery Guide

---

## 1. Supabase Backup Options & Plain Cost Assessment

### Free Plan vs. Pro Plan vs. PITR
- **Free Plan**: Includes daily automated backups stored for 7 days. Backups cannot be downloaded directly via UI; projects pause after 7 days of inactivity (unacceptable for an active store).
- **Pro Plan ($25/month)**: **RECOMMENDED & MANDATORY FOR PRODUCTION**. Keeps your project active 24/7, includes 7 days of daily backups, 8 GB database storage, 250 GB bandwidth, and allows manual backups.
- **Point-in-Time Recovery (PITR - $100/month add-on)**: Allows restoring the database to any specific second (e.g., 2 minutes before an accidental drop or corruption). For a launch-stage e-commerce store with low-to-medium order volume, PITR is optional. Enable it once you consistently process over 50 orders per day.

---

## 2. Automated Daily / Weekly Manual Export Routine

To avoid cloud vendor lock-in and keep an off-site copy of all financial, order, and customer records:

### Core Tables to Dump
1. `public.orders`
2. `public.payment_submissions`
3. `public.order_audit_log`
4. `public.profiles`
5. `public.products`
6. `public.notifications_outbox`

### Command-Line Export Script
Run this script weekly from a secure terminal (stored in encrypted storage):

```bash
# Export business-critical tables with data only
pg_dump "postgresql://postgres:[YOUR-DB-PASSWORD]@db.lqzrahjmgzdsbosywjju.supabase.co:5432/postgres" \
  --data-only \
  --table=public.orders \
  --table=public.payment_submissions \
  --table=public.order_audit_log \
  --table=public.profiles \
  --table=public.products \
  --table=public.notifications_outbox \
  --file="nirai_backup_$(date +%Y%m%d).sql"
```

---

## 3. Restore Rehearsal Procedure

Never assume a backup works until you have restored it into an isolated test environment.

### Rehearsal Protocol (Test Every 3 Months)
1. **Provision Local / Test Instance**:
   ```bash
   npx supabase start
   ```
2. **Apply Migrations First** (creates tables and schema):
   ```bash
   npx supabase db reset
   ```
3. **Import Dump Data**:
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < "nirai_backup_20261019.sql"
   ```
4. **Run Verification Queries**:
   ```sql
   SELECT count(*) FROM public.orders;
   SELECT count(*) FROM public.payment_submissions;
   SELECT count(*) FROM public.products;
   ```
5. **Run DB Tests**:
   ```bash
   npm run test:db
   ```
If all tests pass and row counts match, the backup is validated.
