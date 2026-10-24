BEGIN;
-- Required by the importers' ON CONFLICT(external_id); missing in the source DB.
CREATE UNIQUE INDEX IF NOT EXISTS jobs_external_id_unique ON public.jobs(external_id);
DROP POLICY IF EXISTS anon_insert_scraping_logs ON public.scraping_logs;
DROP POLICY IF EXISTS anon_update_scraping_logs ON public.scraping_logs;
DROP POLICY IF EXISTS anon_delete_scraping_logs ON public.scraping_logs;
DROP POLICY IF EXISTS anon_insert_salary_research ON public.salary_research;
UPDATE public.job_sources SET is_active=false WHERE name NOT IN ('Himalayas','Remotive','CI&T (Lever)');
UPDATE public.subscription_plans SET is_active=false WHERE NOT is_free;
UPDATE public.subscription_plans SET features='["Consulta aos anúncios públicos", "Perfil e currículo", "Favoritos e candidaturas internas"]'::jsonb WHERE is_free;
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='subscription_plans' AND policyname<>'admin_manage'
 LOOP EXECUTE format('DROP POLICY %I ON public.subscription_plans',p.policyname); END LOOP;
END $$;
CREATE POLICY active_plans_read ON public.subscription_plans FOR SELECT TO anon,authenticated USING(is_active);
CREATE OR REPLACE VIEW public.live_jobs WITH (security_invoker=true) AS
SELECT * FROM public.jobs WHERE data_verified AND status='published'
AND (source_expires_at IS NULL OR source_expires_at>now())
AND (is_internal OR last_checked_at>now()-interval '36 hours');
REVOKE ALL ON public.live_jobs FROM anon,authenticated;
GRANT SELECT ON public.live_jobs TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
