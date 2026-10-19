# Database Migrations Workflow

This document outlines the strict protocol for creating, testing, reviewing, and applying database migrations for Nirai Handlooms.

---

## 1. Migration Lifecycle Overview

```
1. Create Migration File (Timestamped)
                │
                ▼
2. Test on Local Database (supabase start & npm run test:db)
                │
                ▼
3. Open Pull Request to main (Triggers CI & Staging Preview)
                │
                ▼
4. Code Review & PR Approval
                │
                ▼
5. Merge into main Branch
                │
                ▼
6. Run Pre-Push Safety Check (`node scripts/pre-push-check.js`)
                │
                ▼
7. Manual Push to Production (`npx supabase db push`)
```

> **CRITICAL RULE:**  
> **Never auto-push database migrations to production on git commit.** Database schema changes must only be pushed manually by the repository owner or via a protected GitHub Action requiring manual approval.

---

## 2. Step-by-Step Instructions

### Step 1: Create Migration
Run Supabase CLI or create a timestamped SQL file in `supabase/migrations/`:
```bash
npx supabase migration new add_feature_name
```
File naming format: `YYYYMMDDHHMMSS_brief_description.sql`

For every migration, also create a companion rollback script in `supabase/rollbacks/`:
`rollback_YYYYMMDDHHMMSS_brief_description.sql`

### Step 2: Test Locally
Apply migration against local instance:
```bash
npx supabase db reset
npm run test:db
```

### Step 3: Run Pre-Push Check
Before executing any remote migration push, run the safety verification script:
```bash
node scripts/pre-push-check.js
```
This prints the currently linked project reference and warns if pointed at production.

### Step 4: Link and Push to Staging
```bash
# Link to staging project
npx supabase link --project-ref <STAGING_PROJECT_REF>

# Apply migration
npx supabase db push
```

### Step 5: Merge PR & Push to Production (Manual Execution)
Only after the PR is merged into `main`:
```bash
# 1. Link to production project
npx supabase link --project-ref lqzrahjmgzdsbosywjju

# 2. Verify link
node scripts/pre-push-check.js

# 3. Apply migration to production
npx supabase db push
```
