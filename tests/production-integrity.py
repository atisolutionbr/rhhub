"""Read-only production audit. Never creates or modifies jobs or accounts."""
import json
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

env = dict(line.split('=',1) for line in Path('/opt/rhhub/backend/.env.backend').read_text().splitlines() if '=' in line)
def sql(query):
    return subprocess.check_output(['docker','exec','rhhub-backend-db-1','psql','-U','postgres','-d','postgres','-Atc',query],text=True).strip()
def api(path):
    req=urllib.request.Request('https://rh.atisolution.com.br/backend/'+path,headers={'apikey':env['ANON_KEY'],'Authorization':'Bearer '+env['ANON_KEY']})
    try:
        with urllib.request.urlopen(req,timeout=30) as r:return r.status,json.loads(r.read() or 'null')
    except urllib.error.HTTPError as e:return e.code,None

checks={}
checks['quarantined_jobs_not_public']=sql("SELECT count(*) FROM live_jobs j JOIN rhhub_audit.quarantine q ON q.table_name='jobs' AND q.record_id=j.id")=='0'
checks['all_5000_generated_rows_archived']=sql("SELECT count(*) FROM rhhub_audit.quarantine WHERE table_name='jobs' AND reason='Generated seed job'")=='5000'
checks['no_import_without_source_evidence']=sql("SELECT count(*) FROM live_jobs WHERE NOT is_internal AND (source_url IS NULL OR external_url IS NULL OR source_payload IS NULL OR source_payload_hash IS NULL OR last_checked_at IS NULL)")=='0'
checks['himalayas_salary_matches_payload']=sql("SELECT count(*) FROM live_jobs WHERE external_source='Himalayas' AND (salary_min IS DISTINCT FROM (source_payload->>'minSalary')::numeric OR salary_max IS DISTINCT FROM (source_payload->>'maxSalary')::numeric OR salary_currency IS DISTINCT FROM source_payload->>'currency' OR salary_period IS DISTINCT FROM source_payload->>'salaryPeriod')")=='0'
checks['himalayas_application_links_unchanged']=sql("SELECT count(*) FROM live_jobs WHERE external_source='Himalayas' AND external_url IS DISTINCT FROM source_payload->>'applicationLink'")=='0'
checks['no_duplicate_source_identifiers']=sql("SELECT count(*) FROM (SELECT external_id FROM jobs WHERE external_id IS NOT NULL GROUP BY external_id HAVING count(*)>1) duplicates")=='0'
checks['no_anonymous_log_or_market_writes']=sql("SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename IN ('scraping_logs','salary_benchmarks','company_rankings','salary_research') AND ('anon'=ANY(roles) OR 'public'=ANY(roles)) AND cmd<>'SELECT'")=='0'
checks['fake_salary_benchmarks_not_public']=api('rest/v1/salary_benchmarks?select=id')==(200,[])
checks['fake_company_rankings_not_public']=api('rest/v1/company_rankings?select=id')==(200,[])
status,summary=api('rest/v1/rpc/portal_market_summary')
checks['public_summary_matches_entire_database']=status==200 and summary['total']==int(sql('SELECT count(*) FROM live_jobs'))
checks['public_company_relationship_works']=api('rest/v1/live_jobs?select=id,company:companies(name)&limit=1')[0]==200
checks['no_paid_demo_plan_published']=api('rest/v1/subscription_plans?is_free=eq.false&select=id')==(200,[])
for name in ['scrape-tech-jobs','scrape-trabalhaes','rss-fetch','csv-import','webhook-receiver']:
    checks['retired_'+name]=api('functions/v1/'+name)[0]==410
print(json.dumps({'checks':checks,'public_total':summary.get('total') if status==200 else None,'sources':summary.get('sources') if status==200 else None},indent=2))
raise SystemExit(0 if all(checks.values()) else 1)
