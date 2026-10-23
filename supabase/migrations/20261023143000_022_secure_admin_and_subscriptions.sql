-- Source snapshots had anonymous write access to job_sources, and subscribers
-- could change their own paid-plan/status fields. Keep these actions trusted.
DROP POLICY IF EXISTS anon_select_job_sources ON public.job_sources;
DROP POLICY IF EXISTS anon_insert_job_sources ON public.job_sources;
DROP POLICY IF EXISTS anon_update_job_sources ON public.job_sources;
DROP POLICY IF EXISTS anon_delete_job_sources ON public.job_sources;
DROP POLICY IF EXISTS subscriptions_own ON public.subscriptions;
CREATE POLICY subscriptions_read_own ON public.subscriptions FOR SELECT
TO authenticated USING (user_id = auth.uid());

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'technologies','categories','users','companies','candidate_profiles','jobs',
    'job_applications','application_logs','subscription_plans','subscriptions',
    'favorites','job_alerts','articles','banners','job_sources','scraping_logs',
    'salary_benchmarks','company_rankings','salary_research','user_gamification'
  ] LOOP
    EXECUTE format('CREATE POLICY admin_manage ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', table_name);
  END LOOP;
END $$;
NOTIFY pgrst, 'reload schema';
