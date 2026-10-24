const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const result = buildSync({entryPoints:['src/lib/format.ts'],bundle:true,write:false,platform:'node',format:'cjs'});
const mod = {exports:{}};
new Function('module','exports',result.outputFiles[0].text)(mod,mod.exports);
const { formatSalary } = mod.exports;
test('salary preserves foreign currency and actual pay period',()=>{
  const output=formatSalary(100,150,'hourly','USD');
  assert.match(output,/US\$/); assert.doesNotMatch(output,/R\$/); assert.match(output,/hora/);
  assert.match(formatSalary(50000,80000,'annual','EUR'),/ano/);
});
test('missing salary does not imply a negotiated offer',()=>{
  assert.equal(formatSalary(null,null,'monthly','BRL'),'Salário não informado');
});
