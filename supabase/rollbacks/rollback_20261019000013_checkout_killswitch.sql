-- Rollback: rollback_20261019000013_checkout_killswitch.sql

BEGIN;

ALTER TABLE public.settings DROP COLUMN IF EXISTS checkout_enabled;
ALTER TABLE public.settings DROP COLUMN IF EXISTS maintenance_message_en;
ALTER TABLE public.settings DROP COLUMN IF EXISTS maintenance_message_ta;

COMMIT;
