"""Import attributed live jobs; never invent salary, location or contract data.

Runs on the RHHub VPS using stdlib only. Upstream snapshots and per-job hashes
are retained privately. The public application uses only data_verified records.
"""
import argparse
import hashlib
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
import uuid

class SourceRateLimit(RuntimeError):
    def __init__(self, seconds):
        self.seconds = seconds
        super().__init__('Source HTTP 429; retry after ' + str(seconds) + ' seconds')

ROOT = Path('/opt/rhhub')
ENV = {}
NOW = lambda: datetime.now(timezone.utc).isoformat()
TECH = re.compile(r'\b(software|developer|desenvolvedor|programador|frontend|backend|full.?stack|devops|sre|cloud|cyber|security|qa|data|dados|python|java|javascript|typescript|react|node|mobile|android|ios|machine learning|artificial intelligence|product designer|ux|ui|database|sysadmin|IT support|IT engineer|technical support|systems engineer|platform engineer|solutions architect|tech lead)\b', re.I)
TECHNOLOGIES = ['Python','JavaScript','TypeScript','React','Node.js','Java','C#','.NET','AWS','Azure','GCP','Docker','Kubernetes','SQL','PostgreSQL','Golang','Rust','PHP','Ruby','Flutter','Swift','Kotlin','Angular','Vue.js']

def tags_for(text):
    return [name for name in TECHNOLOGIES if re.search(r'(?<!\w)' + re.escape(name) + r'(?!\w)', text, re.I)]

def category_for(title):
    for pattern, category in [(r'devops|\bsre\b|cloud|platform engineer','devops'),(r'data|dados|machine learning|artificial intelligence','data-science'),(r'security|cyber|seguran','security'),(r'mobile|android|\bios\b|flutter','mobile'),(r'full.?stack','full-stack'),(r'front.?end|react|angular|vue','frontend'),(r'back.?end|\bapi\b','backend'),(r'\bqa\b|quality|test automation','qa-testing'),(r'designer|\bux\b|\bui\b','design'),(r'product manager|product owner','product'),(r'tech lead|engineering manager|head of','leadership')]:
        if re.search(pattern, title, re.I): return category
    return 'desenvolvimento'

def api(path, method='GET', payload=None):
    headers = {'apikey': ENV['SERVICE_ROLE_KEY'], 'Authorization': 'Bearer ' + ENV['SERVICE_ROLE_KEY'], 'Content-Type': 'application/json', 'Prefer': 'return=representation,resolution=merge-duplicates'}
    req = urllib.request.Request('http://127.0.0.1:18120/rest/v1/' + path, method=method, headers=headers, data=None if payload is None else json.dumps(payload).encode())
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = json.loads(exc.read())
        raise RuntimeError('Database ' + str(exc.code) + ': ' + str(detail.get('code')) + ' ' + str(detail.get('message'))) from None

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'RHHub/1.0 (+https://rh.atisolution.com.br)', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=40) as response:
            if response.geturl().split('/')[2] != urllib.parse.urlparse(url).netloc:
                raise ValueError('Unexpected upstream redirect')
            return json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            retry = exc.headers.get('Retry-After', '900')
            try: seconds = max(60, int(retry))
            except ValueError:
                try: seconds = max(60, int(parsedate_to_datetime(retry).timestamp() - time.time()))
                except (ValueError, TypeError): seconds = 900
            raise SourceRateLimit(seconds) from None
        raise

def plain(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', ' ', value or ''))).strip()

def stamp(value):
    if value is None: return None
    try:
        if isinstance(value, (float, int)): return datetime.fromtimestamp(value / 1000 if value > 100000000000 else value, timezone.utc).isoformat()
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        if parsed.tzinfo is None: parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    except (ValueError, TypeError, OverflowError): return None

def slug(value):
    return re.sub('[^a-z0-9]+', '-', value.lower()).strip('-')[:90]

def live_url(value, allowed=None):
    parsed = urllib.parse.urlparse(value or '')
    return parsed.scheme == 'https' and bool(parsed.hostname) and (allowed is None or parsed.hostname in allowed)

def normalize(raw, provider, checked):
    if provider == 'Himalayas':
        title, company = plain(raw.get('title')), plain(raw.get('companyName'))
        categories = raw.get('categories', []) + raw.get('parentCategories', [])
        if not TECH.search(title + ' ' + ' '.join(categories)): return None
        source_url, apply_url = raw.get('guid'), raw.get('applicationLink')
        if not live_url(source_url, {'himalayas.app'}) or not live_url(apply_url, {'himalayas.app'}): return None
        expires = stamp(raw.get('expiryDate'))
        if not expires or expires <= checked: return None
        published = stamp(raw.get('pubDate'))
        locations = raw.get('locationRestrictions') or []
        zones = [str(x) for x in raw.get('timezoneRestrictions') or []]
        description = plain(raw.get('description') or raw.get('excerpt'))
        minimum, maximum = raw.get('minSalary'), raw.get('maxSalary')
        currency, period = raw.get('currency'), raw.get('salaryPeriod')
        employment = raw.get('employmentType')
        level = raw.get('seniority')
        if isinstance(level, list): level = level[0] if len(level) == 1 else None
        seniority = {'Entry-level': 'junior', 'Mid-level': 'mid', 'Senior': 'senior', 'Manager': 'manager', 'Director': 'director', 'Executive': 'executive'}.get(level)
        external_id = 'himalayas:' + source_url
        salary_text = None
    elif provider == 'Remotive':
        title, company = plain(raw.get('title')), plain(raw.get('company_name'))
        if not TECH.search(title + ' ' + str(raw.get('category', ''))): return None
        region = raw.get('candidate_required_location') or ''
        if not re.search(r'worldwide|anywhere|brazil|brasil|latin america|latam|south america|americas', region, re.I): return None
        source_url = apply_url = raw.get('url')
        if not live_url(source_url, {'remotive.com', 'www.remotive.com'}): return None
        published, expires = stamp(raw.get('publication_date')), None
        if not published: return None
        locations, zones = [region] if region else [], []
        description = plain(raw.get('description'))
        minimum = maximum = currency = period = seniority = None
        salary_text = plain(raw.get('salary')) or None
        employment = raw.get('job_type')
        external_id = 'remotive:' + str(raw.get('id'))
    else:
        title, company = plain(raw.get('text')), 'CI&T'
        metadata = raw.get('categories') or {}
        if not TECH.search(title + ' ' + str(metadata.get('team', ''))): return None
        if str(raw.get('country', '')).upper() != 'BR': return None
        source_url, apply_url = raw.get('hostedUrl'), raw.get('applyUrl')
        if not live_url(source_url, {'jobs.lever.co'}) or not live_url(apply_url, {'jobs.lever.co'}): return None
        published, expires = stamp(raw.get('createdAt')), None
        description = plain(' '.join([raw.get('descriptionPlain') or '', raw.get('openingPlain') or '', raw.get('additionalPlain') or ''] + [str(item.get('text','')) + ' ' + str(item.get('content','')) for item in raw.get('lists') or []]))
        locations, zones = None, []
        minimum = maximum = currency = period = seniority = salary_text = None
        employment = metadata.get('commitment')
        external_id = 'lever:ciandt:' + str(raw.get('id'))
    if not title or not company or not description or not published: return None
    if minimum is not None and (not isinstance(minimum, (int, float)) or minimum < 0): return None
    if maximum is not None and (not isinstance(maximum, (int, float)) or maximum < 0): return None
    if minimum is not None and maximum is not None and minimum > maximum: return None
    if (minimum is not None or maximum is not None) and (not currency or not period):
        minimum = maximum = None
    digest = hashlib.sha256(json.dumps(raw, sort_keys=True).encode()).hexdigest()
    return {'title': title[:200], 'slug': slug(title) + '-' + hashlib.sha256(external_id.encode()).hexdigest()[:12],
            'description': description, 'external_id': external_id, 'external_source': provider,
            'external_url': apply_url, 'source_url': source_url, 'source_payload': raw, 'source_payload_hash': digest,
            'data_verified': True, 'last_checked_at': checked, 'source_expires_at': expires,
            'published_at': published, 'salary_min': minimum, 'salary_max': maximum,
            'salary_currency': currency, 'salary_period': period, 'salary_text': salary_text,
            'location_city': None, 'location_state': None, 'location_country': 'BR' if provider == 'CI&T (Lever)' else None,
            'source_location_text': (raw.get('categories') or {}).get('location') if provider == 'CI&T (Lever)' else None,
            'location_restrictions': locations, 'timezone_restrictions': zones,
            'modality': {'remote': 'remote', 'hybrid': 'hybrid', 'on-site': 'onsite'}.get(raw.get('workplaceType')) if provider == 'CI&T (Lever)' else 'remote', 'seniority': seniority, 'employment_type': None,
            'employment_type_text': employment, 'is_internal': False, 'status': 'published',
            'technologies': tags_for(title + ' ' + description), 'is_featured': False, 'is_urgent': False,
            'company_name_for_import': company}

def source(name, url):
    rows = api('job_sources?name=eq.' + urllib.parse.quote(name))
    if rows: return rows[0]['id'] if rows[0]['is_active'] else None
    return api('job_sources', 'POST', {'name': name, 'url': url, 'source_type': 'api', 'is_active': True})[0]['id']

def main(max_pages=400, stage=False, only=None):
    ENV.update(dict(line.split('=', 1) for line in (ROOT / 'backend/.env.backend').read_text().splitlines() if '=' in line))
    started = NOW()
    archive = ROOT / 'backup/verified-feeds' / datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    archive.mkdir(parents=True, exist_ok=True, mode=0o700)
    state_path = ROOT / 'backup/verified-feeds/state.json'
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    def save_state():
        temporary = state_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(state))
        temporary.replace(state_path)
    companies, stats = {}, []
    categories = {row['slug']: row['id'] for row in api('categories?select=id,slug')}
    # Only these documented sources are enabled. Legacy arbitrary scrapers stay disabled.
    for provider, root in [('Himalayas', 'https://himalayas.app/jobs/api/search?country=Brazil&sort=recent'), ('Remotive', 'https://remotive.com/api/remote-jobs'), ('CI&T (Lever)', 'https://api.lever.co/v0/postings/ciandt?mode=json')]:
        if only and only != provider: continue
        sid = source(provider, root)
        if sid is None:
            stats.append(dict(source=provider, complete=False, examined=0, imported=0, error=None, disabled=True))
            continue
        checkpoint = state.get(provider, {})
        if checkpoint.get('not_before', 0) > time.time():
            stats.append(dict(source=provider, complete=False, examined=0, imported=0, error=None, deferred_until=checkpoint['not_before']))
            continue
        cycle_started = checkpoint.get('cycle_started', started)
        first_page = checkpoint.get('next_page', 1) if provider == 'Himalayas' else 1
        found = saved = inserted = updated = 0
        complete, error = False, None
        seen = set()
        try:
            known = set()
            offset = 0
            while True:
                prior = api('jobs?source_id=eq.' + sid + '&select=external_id&limit=1000&offset=' + str(offset))
                known.update(row['external_id'] for row in prior)
                if len(prior) < 1000: break
                offset += 1000
            for page in range(first_page, first_page + max_pages if provider == 'Himalayas' else 2):
                url = root + ('&page=' + str(page) if provider == 'Himalayas' else '')
                data = fetch(url)
                (archive / (provider.lower() + '-' + str(page) + '.json')).write_text(json.dumps(data))
                rows = data if isinstance(data,list) else data.get('jobs')
                if not isinstance(rows, list): raise ValueError('Upstream schema missing jobs array')
                if not rows:
                    complete = True
                    break
                batch = []
                checked = NOW()
                for raw in rows:
                    found += 1
                    row = normalize(raw, provider, checked)
                    if not row or row['external_id'] in seen: continue
                    seen.add(row['external_id'])
                    name = row.pop('company_name_for_import')
                    company_slug = 'source-' + slug(name) + '-' + hashlib.sha256(name.casefold().encode()).hexdigest()[:10]
                    if company_slug not in companies:
                        existing = api('companies?slug=eq.' + company_slug + '&select=id')
                        companies[company_slug] = existing[0]['id'] if existing else api('companies', 'POST', {'name': name, 'slug': company_slug, 'data_verified': True, 'is_verified': False})[0]['id']
                    row.update(company_id=companies[company_slug], source_id=sid)
                    row['category_id'] = categories.get(category_for(row['title']))
                    if stage: row['status'] = 'pending'
                    batch.append(row)
                if batch:
                    api('jobs?on_conflict=external_id', 'POST', batch)
                    saved += len(batch)
                    inserted += sum(row['external_id'] not in known for row in batch)
                    updated += sum(row['external_id'] in known for row in batch)
                    known.update(row['external_id'] for row in batch)
                print(json.dumps({'source': provider, 'page': page, 'examined': found, 'imported': saved}), flush=True)
                if provider != 'Himalayas': complete = True
                state[provider] = {'next_page': page + 1, 'cycle_started': cycle_started}
                save_state()
                time.sleep(1.2)
            if complete:
                api('jobs?source_id=eq.' + sid + '&data_verified=eq.true&last_checked_at=lt.' + urllib.parse.quote(cycle_started), 'PATCH', {'status': 'expired', 'data_verified': False})
                state[provider] = {'next_page': 1, 'not_before': time.time() + 43200}
                save_state()
        except SourceRateLimit as exc:
            error = str(exc)
            state[provider] = {'next_page': page, 'cycle_started': cycle_started, 'not_before': time.time() + exc.seconds}
            save_state()
        except Exception as exc:
            error = type(exc).__name__ + ': ' + str(exc)[:250]
        checked = NOW()
        api('job_sources?id=eq.' + sid, 'PATCH', {'last_synced_at': checked, 'jobs_found_total': found, 'jobs_imported_total': saved})
        record = {'source_id': sid, 'source_name': provider, 'started_at': started, 'finished_at': checked, 'status': 'error' if error else 'success', 'jobs_found': found, 'jobs_imported': inserted, 'jobs_updated': updated, 'error_message': error or (None if complete else 'Partial scan: page limit reached; previous rows were not expired')}
        try: api('scraping_logs', 'POST', record)
        except Exception: print(json.dumps({'log_write_failed': provider}), flush=True)
        stats.append(dict(source=provider, complete=complete, examined=found, imported=inserted, updated=updated, saved=saved, error=error))
    (archive / 'result.json').write_text(json.dumps(stats, indent=2))
    print(json.dumps({'finished': NOW(), 'sources': stats}), flush=True)
    return 1 if any(row['error'] for row in stats) else 0

if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--max-pages', type=int, default=400)
    args.add_argument('--stage', action='store_true')
    args.add_argument('--only', choices=['Himalayas','Remotive','CI&T (Lever)'])
    parsed = args.parse_args()
    raise SystemExit(main(parsed.max_pages, parsed.stage, parsed.only))
