// test/store.test.js — le store local, testé en Node avec un faux localStorage.

import assert from 'node:assert/strict';
import { createLocalStore } from '../src/store.js';
import { createEgg } from '../src/tama.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

let passed = 0;
const failures = [];
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failures.push(name); console.error('  KO  ' + name + '\n      ' + e.message); }
}

console.log('Tests store local');

await test('load sans sauvegarde → null', async () => {
  assert.equal(await createLocalStore(fakeStorage()).load(), null);
});

await test('save puis load → état identique', async () => {
  const store = createLocalStore(fakeStorage());
  const s = createEgg('2026-07-01T09:00:00');
  await store.save(s);
  assert.deepEqual(await store.load(), s);
});

await test('donnée corrompue → null, sans exception', async () => {
  const storage = fakeStorage();
  storage.setItem('tama:state', '{pas du json');
  assert.equal(await createLocalStore(storage).load(), null);
});

await test('version inconnue → null (ancrage des migrations)', async () => {
  const storage = fakeStorage();
  storage.setItem('tama:state', JSON.stringify({ version: 999, stage: 'egg' }));
  assert.equal(await createLocalStore(storage).load(), null);
});

await test('clear efface la sauvegarde', async () => {
  const store = createLocalStore(fakeStorage());
  await store.save(createEgg('2026-07-01T09:00:00'));
  await store.clear();
  assert.equal(await store.load(), null);
});

console.log(`\n${passed} réussis, ${failures.length} échoués${failures.length ? ' : ' + failures.join(', ') : ''}`);
if (failures.length) process.exit(1);
