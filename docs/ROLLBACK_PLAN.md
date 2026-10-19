# Rollback & Emergency Recovery Plan

---

## 1. Instant Vercel Frontend Rollback (< 60 Seconds)

If a bad frontend build white-screens or creates issues in production:
1. Open **Vercel Dashboard > Nirai Project > Deployments**.
2. Find the previous stable production deployment (indicated by a green checkmark).
3. Click the **three dots (...)** next to that deployment and select **Instant Rollback**.
4. Confirm the rollback. Vercel immediately redirects 100% of incoming production edge traffic back to the previous deployment artifact within seconds without re-building.

---

## 2. Database Migration Rollback Strategy

Database migrations modify Postgres state and must be rolled back with care to avoid data loss.

### A. Safe vs. Non-Reversible Earlier Migrations

| Migration File | Reversibility | Notes & Precautions |
| :--- | :--- | :--- |
| `20261018000001_create_profiles_and_addresses.sql` | ⚠️ **Non-Reversible** | Core user profile data. Dropping tables loses customer accounts. |
| `20261018000002_add_fks_constraints_and_indexes.sql` | ✅ **Reversible** | Constraints and indexes can be dropped without losing table rows. |
| `20261018000003_auth_helper_functions_and_rls.sql` | ✅ **Reversible** | Functions and policies can be replaced with prior definitions. |
| `20261018000004_suppliers_couriers_stock_media.sql` | ⚠️ **Data Risk** | Dropping supplier/stock tables will orphan inventory tracking rows. |
| `20261018000005_reviews_table.sql` | ⚠️ **Data Risk** | Dropping loses verified customer reviews. |
| `20261018000006_wishlists_table.sql` | ✅ **Reversible** | Dropping removes user wishlists. |
| `20261018000007_server_order_engine.sql` | ⚠️ **Non-Reversible** | Order table and financial records must NEVER be dropped. |
| `20261018000009_manual_payment_verification_engine.sql`| ⚠️ **Non-Reversible** | Contains legal payment proof records and UTR verification audit logs. |
| `20261018000011_notifications_outbox_engine.sql` | ✅ **Reversible** | Outbox functions can be reverted to previous polling implementations. |
| `20261018000012_notifications_outbox_hardening.sql` | ✅ **Reversible** | Additional indexes and constraints can be dropped safely. |

---

## 3. Standard Down/Rollback SQL Template

For any new migration added, create a corresponding script in `supabase/rollbacks/rollback_<migration_name>.sql`:

```sql
BEGIN;

-- 1. Revert policies or function overrides
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- 2. Drop or rename columns safely without deleting tables
ALTER TABLE public.table_name DROP COLUMN IF EXISTS new_column_name;

-- 3. Restore previous function definition
CREATE OR REPLACE FUNCTION public.my_function(...) ...;

COMMIT;
```
