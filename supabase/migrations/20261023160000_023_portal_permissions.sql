BEGIN;
CREATE OR REPLACE FUNCTION public.has_portal_role(expected text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = expected); $$;
REVOKE ALL ON FUNCTION public.has_portal_role(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_portal_role(text) TO authenticated, service_role;

DROP POLICY IF EXISTS companies_owner_manage ON public.companies;
CREATE POLICY companies_owner_manage ON public.companies FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.has_portal_role('company'))
WITH CHECK (user_id = auth.uid() AND public.has_portal_role('company'));

DROP POLICY IF EXISTS candidate_profiles_manage_own ON public.candidate_profiles;
CREATE POLICY candidate_profiles_manage_own ON public.candidate_profiles FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.has_portal_role('candidate'))
WITH CHECK (user_id = auth.uid() AND public.has_portal_role('candidate'));

DROP POLICY IF EXISTS jobs_company_manage ON public.jobs;
CREATE POLICY jobs_company_manage ON public.jobs FOR ALL TO authenticated
USING (public.has_portal_role('company') AND company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()))
WITH CHECK (public.has_portal_role('company') AND company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS applications_candidate_insert ON public.job_applications;
CREATE POLICY applications_candidate_insert ON public.job_applications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_portal_role('candidate') AND status = 'pending'
AND notes IS NULL AND EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND status IN ('approved', 'published')));

CREATE OR REPLACE FUNCTION public.protect_portal_records()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
    IF TG_TABLE_NAME = 'companies' THEN
      IF TG_OP = 'INSERT' THEN
        IF coalesce(NEW.is_verified, false) THEN
          RAISE EXCEPTION 'Verification requires an administrator' USING ERRCODE = '42501';
        END IF;
      ELSIF NEW.is_verified IS DISTINCT FROM OLD.is_verified OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Company privileges require an administrator' USING ERRCODE = '42501';
      END IF;
    ELSIF TG_TABLE_NAME = 'job_applications' AND TG_OP = 'UPDATE' THEN
      IF NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.user_id IS DISTINCT FROM OLD.user_id
         OR NEW.cover_letter IS DISTINCT FROM OLD.cover_letter OR NEW.source IS DISTINCT FROM OLD.source
         OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Application identity cannot be changed' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.protect_portal_records() FROM PUBLIC;
DROP TRIGGER IF EXISTS protect_portal_company ON public.companies;
CREATE TRIGGER protect_portal_company BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_portal_records();
DROP TRIGGER IF EXISTS protect_portal_application ON public.job_applications;
CREATE TRIGGER protect_portal_application BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.protect_portal_records();

-- Share applicant details only with the owner of the job they applied for.
CREATE OR REPLACE FUNCTION public.company_applicants()
RETURNS TABLE(application_id uuid, full_name text, email text, phone text, headline text, resume_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT a.id, u.full_name, au.email::text, u.phone, cp.headline, cp.resume_url
  FROM public.job_applications a
  JOIN public.jobs j ON j.id = a.job_id
  JOIN public.companies c ON c.id = j.company_id
  JOIN public.users u ON u.id = a.user_id
  JOIN auth.users au ON au.id = a.user_id
  LEFT JOIN public.candidate_profiles cp ON cp.user_id = a.user_id
  WHERE c.user_id = auth.uid() AND public.has_portal_role('company');
$$;
REVOKE ALL ON FUNCTION public.company_applicants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_applicants() TO authenticated, service_role;

DROP POLICY IF EXISTS resume_read_applicant ON storage.objects;
CREATE POLICY resume_read_applicant ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND EXISTS (
  SELECT 1 FROM public.company_applicants() applicant WHERE applicant.resume_url = name
));
DROP POLICY IF EXISTS resume_admin_read ON storage.objects;
CREATE POLICY resume_admin_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resumes' AND public.is_admin());
NOTIFY pgrst, 'reload schema';
COMMIT;
