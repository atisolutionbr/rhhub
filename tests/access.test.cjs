const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const { createRequire } = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function loadSource(entry) {
  const result = buildSync({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-router-dom', '../contexts/AuthContext'],
  });
  const mod = { exports: {} };
  const req = createRequire(require('node:path').resolve(entry));
  const mocked = name => {
    if (name === '../contexts/AuthContext') return { useAuth: () => global.__testAuth };
    if (name === 'react-router-dom') return {
      useLocation: () => ({ pathname: '/admin', search: '?tab=users', hash: '' }),
      Navigate: ({ to }) => React.createElement('span', { 'data-redirect': to }),
    };
    return req(name);
  };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(mocked, mod, mod.exports);
  return mod.exports;
}
const ProtectedRoute = loadSource('src/components/ProtectedRoute.tsx').default;
const { safeReturnPath } = loadSource('src/lib/authRouting.ts');
const render = state => {
  global.__testAuth = { loading: false, user: { id: 'a' }, profile: { id: 'a', user_type: 'admin' }, profileError: null, ...state };
  return renderToStaticMarkup(React.createElement(ProtectedRoute, { allowedTypes: ['admin'] }, 'PRIVATE_DASHBOARD'));
};
test('a session with a pending profile never mounts the private dashboard', () => {
  assert.doesNotMatch(render({ loading: true, profile: null }), /PRIVATE_DASHBOARD/);
});
test('a missing or failed profile cannot reveal a private dashboard', () => {
  for (const state of [{ profile: null }, { profileError: 'network' }, { profile: { id: 'previous-user', user_type: 'admin' } }]) {
    const html = render(state);
    assert.doesNotMatch(html, /PRIVATE_DASHBOARD/);
    assert.match(html, /Tentar novamente/);
  }
});
test('a candidate is redirected without mounting the admin dashboard', () => {
  const html = render({ profile: { id: 'a', user_type: 'candidate' } });
  assert.match(html, /data-redirect="\/candidato"/);
  assert.doesNotMatch(html, /PRIVATE_DASHBOARD/);
});
test('only the matching profile can mount the authorized dashboard', () => {
  assert.match(render({}), /PRIVATE_DASHBOARD/);
  assert.doesNotMatch(render({ user: null }), /PRIVATE_DASHBOARD/);
});
test('return paths reject external destinations and login loops', () => {
  for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/cadastro', '/\nevil.test', null]) {
    assert.equal(safeReturnPath(value, '/candidato'), '/candidato');
  }
  assert.equal(safeReturnPath('/vagas?q=React#resultados', '/candidato'), '/vagas?q=React#resultados');
});
