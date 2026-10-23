"""Exercise real portal workflows; credentials are read from a private JSON file.

Run on the VPS: python3 portal-integration.py /private/accounts.json
JSON entries: {email, password, role}. No credentials or tokens are printed.
Only records bearing a unique test UUID are removed during cleanup.
"""
import json
import sys
import uuid
import urllib.request
import urllib.error
from pathlib import Path

env = dict(line.split('=', 1) for line in Path('/opt/rhhub/backend/.env.backend').read_text().splitlines() if '=' in line)
base = 'https://rh.atisolution.com.br/backend/'
checks, sessions, cleanup = {}, {}, []

def request(path, role=None, method='GET', data=None):
    token = env['SERVICE_ROLE_KEY'] if role == 'service' else sessions.get(role, {}).get('access_token', env['ANON_KEY'])
    headers = {'apikey': env['ANON_KEY'], 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    req = urllib.request.Request(base + path, headers=headers, method=method, data=None if data is None else json.dumps(data).encode())
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        return error.code, json.loads(error.read())

def check(name, condition):
    checks[name] = bool(condition)
    if not condition:
        raise RuntimeError('Failed check: ' + name)

def insert(table, role, row):
    test_id = str(uuid.uuid4())
    row = dict(row, id=test_id)
    # Register before the call so cleanup also covers an unexpected response.
    cleanup.append((table, test_id))
    status, rows = request('rest/v1/' + table, role, 'POST', row)
    return status, rows, test_id

try:
    for account in json.loads(Path(sys.argv[1]).read_text()):
        role = account['role']
        status, body = request('auth/v1/token?grant_type=password', method='POST', data={'email': account['email'], 'password': account['password']})
        check(role + '_password_login', status == 200 and body.get('access_token'))
        sessions[role] = body
        status, rows = request('rest/v1/users?select=id,user_type', role)
        expected = body['user']['id']
        check(role + '_profile_access', status == 200 and any(row['id'] == expected and row['user_type'] == role for row in rows))
        if role != 'admin':
            check(role + '_only_own_user', len(rows) == 1)

    cid, eid = sessions['candidate']['user']['id'], sessions['company']['user']['id']
    status, companies = request('rest/v1/companies?user_id=eq.' + eid, 'company')
    check('company_profile_exists', status == 200 and len(companies) == 1)
    company = companies[0]
    status, _, unexpected_company = insert('companies', 'candidate', {'user_id': cid, 'name': 'Portal test', 'slug': 'portal-test-' + uuid.uuid4().hex})
    check('candidate_cannot_create_company', status in (401, 403))

    marker = 'portal-validation-' + uuid.uuid4().hex
    status, rows, job_id = insert('jobs', 'company', {'company_id': company['id'], 'title': marker, 'slug': marker, 'description': 'Temporary integration verification', 'status': 'draft', 'is_internal': True, 'modality': 'remote', 'seniority': 'mid', 'employment_type': 'clt'})
    check('company_creates_draft', status == 201 and len(rows) == 1)
    check('candidate_cannot_read_draft', request('rest/v1/jobs?id=eq.' + job_id, 'candidate') == (200, []))
    status, rows = request('rest/v1/jobs?id=eq.' + job_id, 'company', 'PATCH', {'status': 'published'})
    check('company_publishes_own_job', status == 200 and len(rows) == 1)
    status, rows = request('rest/v1/jobs?id=eq.' + job_id, 'candidate', 'PATCH', {'title': 'Unauthorized'})
    check('candidate_cannot_edit_job', status == 403 or (status == 200 and rows == []))

    status, rows, app_id = insert('job_applications', 'candidate', {'job_id': job_id, 'user_id': cid, 'cover_letter': marker})
    check('candidate_applies', status == 201 and rows[0]['status'] == 'pending')
    status, rows = request('rest/v1/job_applications?id=eq.' + app_id, 'company')
    check('company_sees_application', status == 200 and len(rows) == 1)
    status, applicants = request('rest/v1/rpc/company_applicants', 'company', 'POST', {})
    check('company_sees_scoped_candidate_details', status == 200 and any(row['application_id'] == app_id and row['email'] == sessions['candidate']['user']['email'] for row in applicants))
    check('candidate_cannot_list_company_applicants', request('rest/v1/rpc/company_applicants', 'candidate', 'POST', {}) == (200, []))
    status, rows = request('rest/v1/job_applications?id=eq.' + app_id, 'company', 'PATCH', {'status': 'reviewed'})
    check('company_updates_application_status', status == 200 and rows[0]['status'] == 'reviewed')
    status, rows = request('rest/v1/job_applications?id=eq.' + app_id, 'candidate')
    check('candidate_tracks_status', status == 200 and rows[0]['status'] == 'reviewed')
    check('company_cannot_reassign_application', request('rest/v1/job_applications?id=eq.' + app_id, 'company', 'PATCH', {'user_id': eid})[0] == 403)

    status, rows, fav_id = insert('favorites', 'candidate', {'user_id': cid, 'job_id': job_id})
    check('candidate_saves_favorite', status == 201 and len(rows) == 1)
    status, rows, alert_id = insert('job_alerts', 'candidate', {'user_id': cid, 'name': marker, 'keywords': ['Python'], 'locations': [], 'frequency': 'daily', 'is_active': True})
    check('candidate_creates_alert', status == 201 and len(rows) == 1)
    check('company_cannot_read_candidate_alert', request('rest/v1/job_alerts?id=eq.' + alert_id, 'company') == (200, []))
    check('candidate_cannot_promote_self', request('rest/v1/users?id=eq.' + cid, 'candidate', 'PATCH', {'user_type': 'admin'})[0] == 403)
    status, body = request('rest/v1/companies?id=eq.' + company['id'], 'company', 'PATCH', {'is_verified': not company['is_verified']})
    check('company_cannot_verify_self', status == 403)

    for table in ('users', 'companies', 'jobs', 'job_sources', 'scraping_logs', 'subscription_plans'):
        check('admin_reads_' + table, request('rest/v1/' + table + '?limit=1', 'admin')[0] == 200)
    status, rows = request('rest/v1/jobs?id=eq.' + job_id, 'admin', 'PATCH', {'status': 'draft'})
    check('admin_moderates_job', status == 200 and len(rows) == 1)
    check('anonymous_cannot_read_application', request('rest/v1/job_applications?id=eq.' + app_id) == (200, []))
finally:
    for table, test_id in reversed(cleanup):
        status, _ = request('rest/v1/' + table + '?id=eq.' + test_id, 'service', 'DELETE')
        checks['cleanup_' + table + '_' + test_id[:8]] = status in (200, 204)
    print(json.dumps(checks, indent=2))

raise SystemExit(0 if all(checks.values()) else 1)

