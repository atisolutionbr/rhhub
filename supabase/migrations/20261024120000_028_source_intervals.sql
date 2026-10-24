BEGIN;
ALTER TABLE public.job_sources ADD COLUMN IF NOT EXISTS sync_interval_minutes integer;
UPDATE public.job_sources SET sync_interval_minutes = 120;
ALTER TABLE public.job_sources ALTER COLUMN sync_interval_minutes SET DEFAULT 120;
ALTER TABLE public.job_sources ALTER COLUMN sync_interval_minutes SET NOT NULL;
ALTER TABLE public.job_sources ADD CONSTRAINT job_sources_interval_range CHECK (sync_interval_minutes BETWEEN 15 AND 10080);
COMMIT;
