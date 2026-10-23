import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// This is a public-data snapshot, not a PostgreSQL/Auth/Storage backup.
const env = Object.fromEntries((await readFile('.env', 'utf8')).split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : [];
}));
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }) },
});
const directory = `.private/exports/${new Date().toISOString().replace(/[:.]/g, '-')}`;
await mkdir(directory, { recursive: true });
const manifest = { createdAt: new Date().toISOString(), scope: 'Public rows visible to anonymous role only. Excludes Auth, private data, Storage, SQL schema and server secrets. Not a consistent transactional backup.', tables: {} };
const tables = ['jobs', 'companies', 'technologies', 'categories', 'subscription_plans', 'salary_benchmarks', 'company_rankings', 'articles', 'banners'];
await Promise.all(tables.map(async table => {
  const rows = [];
  let expected = null;
  try {
    for (let offset = 0; ; offset += 500) {
      const { data, count, error } = await client.from(table).select('*', { count: 'exact' }).order('id').range(offset, offset + 499);
      if (error) throw error;
      expected ??= count;
      rows.push(...data);
      if (data.length < 500) break;
    }
    await writeFile(`${directory}/${table}.json`, JSON.stringify(rows, null, 2));
    manifest.tables[table] = { rows: rows.length, visibleCount: expected, countMatches: expected === rows.length };
  } catch {
    manifest.tables[table] = { error: 'Export incomplete or denied; do not use as a full backup.' };
  }
}));
await writeFile(`${directory}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ directory, ...manifest }, null, 2));
