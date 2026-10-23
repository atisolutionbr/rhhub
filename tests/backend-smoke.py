"""Run only against the isolated RHHub backend clone before public cutover."""
import base64
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
import uuid

base = Path('/opt/rhhub')
source = json.loads((base / 'backup/bolt-database.json').read_text())
env = dict(line.split('=', 1) for line in (base / 'backend/.env.backend').read_text().splitlines() if '=' in line)
checks = {}
def request(path, token=None, method='GET', data=None):
    headers = {'apikey': env['ANON_KEY'], 'Authorization': 'Bearer ' + (token or env['ANON_KEY']), 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    req = urllib.request.Request('http://127.0.0.1:18120/' + path, headers=headers, method=method, data=None if data is None else json.dumps(data).encode())
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())
def jwt(user_id):
    def b64(value):
        return base64.urlsafe_b64encode(json.dumps(value, separators=(',', ':')).encode()).decode().rstrip('=')
    encoded = b64({'alg':'HS256','typ':'JWT'}) + '.' + b64({'role':'authenticated','sub':user_id,'aud':'authenticated','iss':'supabase','iat':int(time.time()),'exp':int(time.time())+300})
    signature = base64.urlsafe_b64encode(hmac.new(env['JWT_SECRET'].encode(), encoded.encode(), hashlib.sha256).digest()).decode().rstrip('=')
    return encoded + '.' + signature
def sql(query):
    return subprocess.check_output(['docker','exec','rhhub-backend-db-1','psql','-U','postgres','-d','postgres','-Atc',query], text=True).strip()

query = 'SELECT jsonb_build_object(' + ','.join("'"+name+"',(SELECT count(*) FROM public.\""+name+'\")' for name in source['public']) + ')'
counts = json.loads(sql(query))
checks['all_20_table_counts'] = all(counts[name] == len(rows) for name, rows in source['public'].items())
checks['auth_user_count'] = int(sql('SELECT count(*) FROM auth.users')) == len(source['auth_users'])
checks['auth_identity_count'] = int(sql('SELECT count(*) FROM auth.identities')) == len(source['auth_identities'])
expected = hashlib.sha256(''.join(user['id']+':'+(user.get('encrypted_password') or '') for user in sorted(source['auth_users'],key=lambda user:user['id'])).encode()).hexdigest()
actual = sql("SELECT encode(extensions.digest(string_agg(id::text||':'||coalesce(encrypted_password,''),'' ORDER BY id::text),'sha256'),'hex') FROM auth.users")
checks['password_hashes_preserved'] = expected == actual
checks['auth_health'] = request('auth/v1/health')[0] == 200
checks['anonymous_cannot_read_users'] = request('rest/v1/users?select=id') == (200, [])
candidate = next(user for user in source['public']['users'] if user['user_type']=='candidate')
admin = next(user for user in source['public']['users'] if user['user_type']=='admin')
candidate_jwt, admin_jwt = jwt(candidate['id']), jwt(admin['id'])
status, rows = request('rest/v1/users?select=id', candidate_jwt)
checks['candidate_reads_only_own_profile'] = status==200 and len(rows)==1 and rows[0]['id']==candidate['id']
status, rows = request('rest/v1/users?select=id', admin_jwt)
checks['admin_reads_all_profiles'] = status==200 and len(rows)==len(source['public']['users'])
status, body = request('rest/v1/users?id=eq.'+candidate['id'],candidate_jwt,'PATCH',{'user_type':'admin'})
checks['candidate_cannot_escalate_role'] = status==403 and body.get('code')=='42501'
status, body = request('rest/v1/subscriptions?user_id=eq.'+candidate['id'],candidate_jwt,'PATCH',{'status':'expired'})
checks['candidate_cannot_change_subscription'] = (status==200 and body==[]) or status==403
test_id = str(uuid.uuid4())
job_source = dict(source['public']['job_sources'][0], id=test_id, name='rhhub-negative-access-check')
status, body = request('rest/v1/job_sources',method='POST',data=job_source)
checks['anonymous_cannot_write_sources'] = status in (401,403) and body.get('code')=='42501'
if not checks['anonymous_cannot_write_sources']:
    request('rest/v1/job_sources?id=eq.'+test_id,env['SERVICE_ROLE_KEY'],'DELETE')
checks['candidate_role_unchanged'] = sql("SELECT user_type FROM public.users WHERE id='"+candidate['id']+"'") == 'candidate'
print(json.dumps(checks, indent=2))
raise SystemExit(0 if all(checks.values()) else 1)
