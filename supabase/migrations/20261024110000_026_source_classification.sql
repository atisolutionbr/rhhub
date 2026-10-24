BEGIN;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source_location_text text;
UPDATE public.jobs j SET category_id=c.id FROM public.categories c
WHERE j.data_verified AND c.slug=CASE
 WHEN lower(j.title) ~ 'devops|\msre\M|cloud|platform engineer' THEN 'devops'
 WHEN lower(j.title) ~ 'data|dados|machine learning|artificial intelligence' THEN 'data-science'
 WHEN lower(j.title) ~ 'security|cyber|seguran' THEN 'security'
 WHEN lower(j.title) ~ 'mobile|android|\mios\M|flutter' THEN 'mobile'
 WHEN lower(j.title) ~ 'full.?stack' THEN 'full-stack'
 WHEN lower(j.title) ~ 'front.?end|react|angular|vue' THEN 'frontend'
 WHEN lower(j.title) ~ 'back.?end|\mapi\M' THEN 'backend'
 WHEN lower(j.title) ~ '\mqa\M|quality|test automation' THEN 'qa-testing'
 WHEN lower(j.title) ~ 'designer|\mux\M|\mui\M' THEN 'design'
 WHEN lower(j.title) ~ 'product manager|product owner' THEN 'product'
 WHEN lower(j.title) ~ 'tech lead|engineering manager|head of' THEN 'leadership'
 ELSE 'desenvolvimento' END;

UPDATE public.jobs j SET technologies=coalesce((
 SELECT jsonb_agg(technology) FROM (VALUES
 ('Python','\mpython\M'),('JavaScript','\mjavascript\M'),('TypeScript','\mtypescript\M'),
 ('React','\mreact\M'),('Node.js','\mnode[.]?js\M'),('Java','\mjava\M'),('C#','\mc#'),
 ('.NET','[.]net\M'),('AWS','\maws\M'),('Azure','\mazure\M'),('GCP','\mgcp\M'),
 ('Docker','\mdocker\M'),('Kubernetes','\mkubernetes\M'),('SQL','\msql\M'),
 ('PostgreSQL','\mpostgresql\M'),('Golang','\mgolang\M'),('Rust','\mrust\M'),
 ('PHP','\mphp\M'),('Ruby','\mruby\M'),('Flutter','\mflutter\M'),('Swift','\mswift\M'),
 ('Kotlin','\mkotlin\M'),('Angular','\mangular\M'),('Vue.js','\mvue[.]?js\M')
 ) terms(technology,pattern)
 WHERE lower(j.title||' '||j.description) ~ pattern
),'[]'::jsonb) WHERE j.data_verified;

CREATE OR REPLACE VIEW public.live_jobs WITH (security_invoker=true) AS
SELECT * FROM public.jobs WHERE data_verified AND status='published'
AND (source_expires_at IS NULL OR source_expires_at>now())
AND (is_internal OR last_checked_at>now()-interval '36 hours');
GRANT SELECT ON public.live_jobs TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
