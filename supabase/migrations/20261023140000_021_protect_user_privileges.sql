-- The original self-update policy allows changing every profile column.
-- Enforce privilege boundaries in PostgreSQL as well as in public registration.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.protect_user_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.user_type NOT IN ('candidate', 'company') OR COALESCE(NEW.is_verified, false) THEN
        RAISE EXCEPTION 'Profile privileges require an administrator' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.user_type IS DISTINCT FROM OLD.user_type
       OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Profile privileges require an administrator' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_user_privileges ON public.users;
CREATE TRIGGER protect_user_privileges
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileges();
REVOKE ALL ON FUNCTION public.protect_user_privileges() FROM PUBLIC;
