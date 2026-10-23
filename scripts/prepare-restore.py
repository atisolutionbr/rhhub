"""Prepare a private restore for a fresh, isolated Supabase database.

Do not execute against an existing application database. Storage file contents
must be copied separately; this script does not claim a full Storage backup.
"""
from pathlib import Path
import base64
import hashlib
import hmac
import json
import secrets
import time

root = Path(__file__).resolve().parents[1]
private = root / '.private' / 'full-export'
data = json.loads((private / 'bolt-database.json').read_text(encoding='utf-8'))
schema = json.loads((private / 'bolt-schema.json').read_text(encoding='utf-8'))

def ident(value):
    return '"' + value.replace('"', '""') + '"'

def literal(value):
    return "'" + value.replace("'", "''") + "'"

sql = ['\\set ON_ERROR_STOP on', 'BEGIN;', 'SET LOCAL search_path = public, extensions;']
sql += ['CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;']
for table in schema['tables']:
    columns = []
    for col in schema['columns']:
        if col['table'] != table['name']:
            continue
        definition = ident(col['name']) + ' ' + col['type']
        if col['generated']:
            raise ValueError('Generated public column needs explicit handling')
        if col['default']:
            definition += ' DEFAULT ' + col['default']
        if col['not_null']:
            definition += ' NOT NULL'
        columns.append(definition)
    sql.append('CREATE TABLE public.' + ident(table['name']) + ' (' + ','.join(columns) + ');')

def insert(table, rows):
    if not rows:
        return
    token = '$rhhub_' + secrets.token_hex(12) + '$'
    payload = json.dumps(rows, ensure_ascii=True)
    sql.append(f'''DO $import$
DECLARE columns text;
BEGIN
  SELECT string_agg(format('%I', a.attname), ',') INTO columns
  FROM pg_attribute a
  WHERE a.attrelid = {literal(table)}::regclass AND a.attnum > 0
    AND NOT a.attisdropped AND a.attgenerated = ''
    AND a.attname IN (SELECT jsonb_object_keys(({token}{payload}{token}::jsonb)->0));
  EXECUTE format('INSERT INTO %s (%s) SELECT %s FROM jsonb_populate_recordset(NULL::%s, $1)',
    {literal(table)}::regclass, columns, columns, {literal(table)}::regclass)
  USING {token}{payload}{token}::jsonb;
END $import$;''')

insert('auth.users', data['auth_users'])
insert('auth.identities', data['auth_identities'])
for name, rows in data['public'].items():
    insert('public.' + name, rows)

for kind in ['p', 'u', 'c', 'f']:
    for con in schema['constraints']:
        if con['type'] == kind:
            sql.append('ALTER TABLE public.' + ident(con['table']) + ' ADD CONSTRAINT ' + ident(con['name']) + ' ' + con['definition'] + ';')
constraint_names = {con['name'] for con in schema['constraints'] if con['type'] in ['p', 'u']}
for index in schema['indexes']:
    if index['indexname'] not in constraint_names:
        sql.append(index['indexdef'] + ';')
for table in schema['tables']:
    if table['rls']:
        sql.append('ALTER TABLE public.' + ident(table['name']) + ' ENABLE ROW LEVEL SECURITY;')
for policy in data['policies']:
    if policy['schemaname'] != 'public':
        continue
    roles = ','.join('PUBLIC' if role == 'public' else ident(role) for role in policy['roles'])
    query = 'CREATE POLICY ' + ident(policy['policyname']) + ' ON public.' + ident(policy['tablename'])
    query += ' AS ' + policy['permissive'] + ' FOR ' + policy['cmd'] + ' TO ' + roles
    if policy['qual']:
        query += ' USING (' + policy['qual'] + ')'
    if policy['with_check']:
        query += ' WITH CHECK (' + policy['with_check'] + ')'
    sql.append(query + ';')
sql += [
    'GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;',
    'GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;',
    'GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;',
    'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;',
    "NOTIFY pgrst, 'reload schema';",
    'COMMIT;',
]
(private / 'restore.sql').write_text('\n'.join(sql), encoding='utf-8')

envfile = private / '.env.backend'
if not envfile.exists():
    jwt_secret = secrets.token_hex(32)
    def b64(raw):
        return base64.urlsafe_b64encode(raw).decode().rstrip('=')
    def jwt(role):
        header = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
        claims = b64(json.dumps({'iss': 'supabase', 'role': role, 'iat': int(time.time()), 'exp': int(time.time()) + 315360000}, separators=(',', ':')).encode())
        signed = header + '.' + claims
        return signed + '.' + b64(hmac.new(jwt_secret.encode(), signed.encode(), hashlib.sha256).digest())
    envfile.write_text('\n'.join([
        'POSTGRES_PASSWORD=' + secrets.token_hex(24),
        'JWT_SECRET=' + jwt_secret,
        'ANON_KEY=' + jwt('anon'),
        'SERVICE_ROLE_KEY=' + jwt('service_role'),
    ]) + '\n', encoding='utf-8')
print('Prepared private restore for', len(schema['tables']), 'tables and', len(data['auth_users']), 'Auth users.')
