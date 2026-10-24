BEGIN;
CREATE OR REPLACE FUNCTION public.protect_company_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='authenticated' THEN
   IF public.is_admin() THEN
     IF NEW.is_verified THEN NEW.data_verified:=true; END IF;
   ELSE
     IF TG_OP='INSERT' THEN NEW.data_verified:=false;
     ELSE NEW.data_verified:=OLD.data_verified; END IF;
   END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_company_evidence() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_job_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='authenticated' THEN
   IF public.is_admin() THEN
     IF NEW.status IN ('published','approved') AND EXISTS (SELECT 1 FROM rhhub_audit.quarantine WHERE table_name='jobs' AND record_id=NEW.id) THEN
       RAISE EXCEPTION 'Registros da quarentena nao podem ser republicados' USING ERRCODE='42501';
     END IF;
     IF NEW.status IN ('published','approved') AND NEW.is_internal THEN
       IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id=NEW.company_id AND is_verified AND data_verified) THEN
         RAISE EXCEPTION 'Revise e verifique o cadastro da empresa antes de publicar a vaga' USING ERRCODE='42501';
       END IF;
       NEW.data_verified:=true; NEW.last_checked_at:=now();
       NEW.published_at:=coalesce(NEW.published_at,now());
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
COMMIT;
