## PR Summary

<!-- Brief description of the changes introduced in this PR -->

## Pre-Merge Verification Checklist

- [ ] **Database & Migrations**:
  - [ ] Are new migrations included in `supabase/migrations/` using timestamped naming?
  - [ ] Have down/rollback migration SQL scripts been written and verified?
  - [ ] Are RLS policies enabled and verified for any new tables?
  - [ ] Have SQL tests in `supabase/tests/` been executed against local/staging (`npm run test:db`)?

- [ ] **Environment & Configuration**:
  - [ ] Are new environment variables documented in `docs/ENVIRONMENTS.md`?
  - [ ] Have client `VITE_*` variables been added to Vercel Preview & Production dashboards?
  - [ ] Have server-only secrets been stored in Supabase secrets (NEVER with `VITE_` prefix)?

- [ ] **Quality, Security & Performance**:
  - [ ] TypeScript check passed: `npx tsc --noEmit`
  - [ ] Unit tests passed: `npm run test:unit`
  - [ ] Production build verified: `npm run build`
  - [ ] First-load JS gzip budget check passed (<10% growth): `npm run budget:check`
  - [ ] No secrets, keys, or credentials committed (verified with Gitleaks)
  - [ ] Accessibility (axe-core) smoke tests passed for modified views

## Deployment Notes

<!-- Any manual deployment instructions, Supabase dashboard settings, or DNS updates needed -->
