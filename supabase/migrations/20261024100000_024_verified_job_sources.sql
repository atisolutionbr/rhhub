BEGIN;
CREATE SCHEMA IF NOT EXISTS rhhub_audit;
REVOKE ALL ON SCHEMA rhhub_audit FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS rhhub_audit.quarantine (
  table_name text NOT NULL, record_id uuid NOT NULL, reason text NOT NULL,
  payload jsonb NOT NULL, archived_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(table_name, record_id)
);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS data_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_expires_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_payload jsonb;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_payload_hash text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_text text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS location_restrictions text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS timezone_restrictions text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS employment_type_text text;
ALTER TABLE public.jobs ALTER COLUMN modality DROP NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN seniority DROP NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN employment_type DROP NOT NULL;
ALTER TABLE public.jobs ALTER COLUMN salary_min TYPE numeric;
ALTER TABLE public.jobs ALTER COLUMN salary_max TYPE numeric;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS data_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.salary_benchmarks ADD COLUMN IF NOT EXISTS data_verified boolean NOT NULL DEFAULT false;
ALTER TABLE public.company_rankings ADD COLUMN IF NOT EXISTS data_verified boolean NOT NULL DEFAULT false;

INSERT INTO rhhub_audit.quarantine(table_name,record_id,reason,payload)
SELECT 'jobs', id, CASE WHEN description LIKE 'Estamos em busca de um(a)%' THEN 'Generated seed job' ELSE 'Legacy job without verified live source' END,to_jsonb(j)
FROM public.jobs j WHERE NOT data_verified ON CONFLICT DO NOTHING;
UPDATE public.jobs SET status='draft' WHERE NOT data_verified;
INSERT INTO rhhub_audit.quarantine(table_name,record_id,reason,payload)
SELECT 'companies',id,'Legacy company without source evidence',to_jsonb(c) FROM public.companies c WHERE NOT data_verified ON CONFLICT DO NOTHING;
INSERT INTO rhhub_audit.quarantine(table_name,record_id,reason,payload)
SELECT 'salary_benchmarks',id,'Seed salary benchmark without methodology or observations',to_jsonb(s) FROM public.salary_benchmarks s WHERE NOT data_verified ON CONFLICT DO NOTHING;
INSERT INTO rhhub_audit.quarantine(table_name,record_id,reason,payload)
SELECT 'company_rankings',id,'Seed ranking without source evidence',to_jsonb(r) FROM public.company_rankings r WHERE NOT data_verified ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS jobs_public_read ON public.jobs;
CREATE POLICY jobs_public_read ON public.jobs FOR SELECT TO anon,authenticated
USING (status IN ('approved','published') AND data_verified
AND (source_expires_at IS NULL OR source_expires_at>now())
AND (is_internal OR last_checked_at>now()-interval '36 hours'));
DROP POLICY IF EXISTS companies_public_read ON public.companies;
CREATE POLICY companies_public_read ON public.companies FOR SELECT TO anon,authenticated USING(data_verified);

DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public'
 AND tablename IN ('salary_benchmarks','company_rankings') AND policyname<>'admin_manage'
 LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename); END LOOP;
END $$;
CREATE POLICY verified_salary_read ON public.salary_benchmarks FOR SELECT TO anon,authenticated USING(data_verified);
CREATE POLICY verified_ranking_read ON public.company_rankings FOR SELECT TO anon,authenticated USING(data_verified);

CREATE OR REPLACE FUNCTION public.protect_job_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='authenticated' THEN
   IF public.is_admin() THEN
     IF NEW.status IN ('published','approved') AND EXISTS (SELECT 1 FROM rhhub_audit.quarantine WHERE table_name='jobs' AND record_id=NEW.id) THEN
       RAISE EXCEPTION 'Quarantined legacy records cannot be republished' USING ERRCODE='42501';
     END IF;
     IF NEW.status IN ('published','approved') AND NEW.is_internal THEN
       NEW.data_verified:=true; NEW.last_checked_at:=now();
     END IF;
   ELSE
     NEW.data_verified:=false; NEW.source_payload:=NULL; NEW.source_payload_hash:=NULL;
     NEW.last_checked_at:=NULL; NEW.source_url:=NULL;
     IF NEW.status IN ('published','approved') THEN NEW.status:='pending'; END IF;
   END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_job_evidence() FROM PUBLIC;
DROP TRIGGER IF EXISTS protect_job_evidence ON public.jobs;
CREATE TRIGGER protect_job_evidence BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.protect_job_evidence();
CREATE INDEX IF NOT EXISTS jobs_verified_source_idx ON public.jobs(source_id,last_checked_at) WHERE data_verified;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_external_id_unique ON public.jobs(external_id);
CREATE OR REPLACE FUNCTION public.protect_company_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='authenticated' AND NOT public.is_admin() THEN
   IF TG_OP='INSERT' THEN NEW.data_verified:=false;
   ELSE NEW.data_verified:=OLD.data_verified; END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_company_evidence() FROM PUBLIC;
DROP TRIGGER IF EXISTS protect_company_evidence ON public.companies;
CREATE TRIGGER protect_company_evidence BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_company_evidence();
CREATE OR REPLACE FUNCTION public.portal_market_summary()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
WITH valid AS MATERIALIZED (
 SELECT company_id,external_source,technologies,last_checked_at FROM public.jobs
 WHERE data_verified AND status='published'
 AND (source_expires_at IS NULL OR source_expires_at>now())
 AND (is_internal OR last_checked_at>now()-interval '36 hours')
)
SELECT jsonb_build_object(
 'total',(SELECT count(*) FROM valid),
 'last_checked_at',(SELECT max(last_checked_at) FROM valid),
 'sources',coalesce((SELECT jsonb_agg(to_jsonb(s)) FROM (SELECT external_source AS name,count(*) AS count FROM valid GROUP BY external_source ORDER BY count(*) DESC) s),'[]'::jsonb),
 'companies',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM (SELECT companies.name,count(*) AS count FROM valid JOIN public.companies companies ON companies.id=valid.company_id GROUP BY companies.name ORDER BY count(*) DESC LIMIT 20) c),'[]'::jsonb),
 'technologies',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT tech AS name,count(*) AS count FROM valid CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(technologies,'[]'::jsonb)) tech GROUP BY tech ORDER BY count(*) DESC LIMIT 20) t),'[]'::jsonb)
);
$$;
REVOKE ALL ON FUNCTION public.portal_market_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_market_summary() TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
