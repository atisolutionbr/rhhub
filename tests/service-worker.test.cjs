const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function worker(options = {}) {
  const handlers = {}, deleted = [], stored = [];
  const cache = { addAll: async () => {}, put: async (...args) => stored.push(args) };
  const context = {
    self: { location: { origin: 'https://rh.example' }, addEventListener: (name, handler) => handlers[name] = handler, skipWaiting() {}, clients: { claim: async () => {} } },
    caches: { open: async () => cache, keys: async () => ['ati-techhub-v1', 'another-app'], delete: async key => deleted.push(key), match: async () => options.fallback },
    URL, Response, fetch: options.fetch || (async () => new Response('ok', { headers: { 'Content-Type': 'text/html' } })),
  };
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), context);
  return { handlers, deleted, stored };
}
test('activation only removes old RHHub caches', async () => {
  const w = worker(); let work;
  w.handlers.activate({ waitUntil: promise => work = promise }); await work;
  assert.deepEqual(w.deleted, ['ati-techhub-v1']);
});
test('private pages, auth callbacks, APIs and external requests are not intercepted', () => {
  const w = worker();
  for (const path of ['/admin', '/candidato/perfil', '/empresa', '/login', '/cadastro', '/?code=private', '/?access_token=private', '/api/jobs', '/health', 'https://backend.example/rest/v1/users']) {
    let intercepted = false;
    w.handlers.fetch({ request: { method: 'GET', url: new URL(path, 'https://rh.example').href, mode: 'navigate' }, respondWith: () => intercepted = true });
    assert.equal(intercepted, false, path);
  }
});
test('public navigation falls back to the cached shell offline', async () => {
  const fallback = new Response('offline-shell');
  const w = worker({ fallback, fetch: async () => { throw new Error('offline'); } }); let result;
  w.handlers.fetch({ request: { method: 'GET', url: 'https://rh.example/vagas', mode: 'navigate' }, respondWith: promise => result = promise });
  assert.equal(await (await result).text(), 'offline-shell');
});
test('HTTP failures are returned but never cached as the app shell', async () => {
  const w = worker({ fetch: async () => new Response('failure', { status: 500 }) }); let result;
  w.handlers.fetch({ request: { method: 'GET', url: 'https://rh.example/vagas', mode: 'navigate' }, respondWith: promise => result = promise });
  assert.equal((await result).status, 500); assert.equal(w.stored.length, 0);
});
