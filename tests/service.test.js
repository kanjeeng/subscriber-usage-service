'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { UsageStore } = require('../src/store');
const { createService } = require('../src/service');
const { seed } = require('../src/seed');

const valid = { subscriberId: 'SUB01', callMinutes: 10, smsCount: 2, dataUsageMB: 100.5 };
const fresh = () => { const store = new UsageStore(); return { store, svc: createService(store) }; };

test('create: data valid -> 201, id & timestamp terisi', () => {
  const { svc } = fresh();
  const r = svc.create(valid);
  assert.equal(r.status, 201);
  assert.equal(r.body.data.id, 1);
  assert.ok(!Number.isNaN(Date.parse(r.body.data.timestamp)));
});

test('create: menolak input tidak valid', () => {
  const { svc } = fresh();
  const bad = [
    null, [], 'x',
    { ...valid, subscriberId: '  ' },
    { ...valid, subscriberId: 5 },
    { ...valid, callMinutes: -1 },
    { ...valid, dataUsageMB: '100' },
    { ...valid, smsCount: 1.5 },
    { ...valid, dataUsageMB: Infinity },
    { subscriberId: 'SUB01' },
    { ...valid, timestamp: 'bukan-tanggal' },
  ];
  for (const b of bad) assert.equal(svc.create(b).status, 400, JSON.stringify(b));
});

test('create: menghormati timestamp ISO yang dikirim & trim subscriberId', () => {
  const { svc } = fresh();
  const r = svc.create({ ...valid, subscriberId: ' SUB09 ', timestamp: '2025-08-01T08:00:00+07:00' });
  assert.equal(r.body.data.subscriberId, 'SUB09');
  assert.equal(r.body.data.timestamp, '2025-08-01T01:00:00.000Z');
});

test('list: filter subscriberId dan rentang waktu', () => {
  const { store, svc } = fresh();
  seed(store);
  assert.equal(svc.list({}).body.count, 8);
  assert.equal(svc.list({ subscriberId: 'SUB02' }).body.count, 2);
  assert.equal(svc.list({ from: '2025-08-01T11:00:00+07:00' }).body.count, 2); // snapshot 12:00 saja
  assert.equal(svc.list({ subscriberId: 'NOPE' }).body.count, 0);
  assert.equal(svc.list({ from: 'xx' }).status, 400);
});

test('get: 200 untuk id ada, 404 untuk id tidak ada / bukan angka', () => {
  const { svc } = fresh();
  svc.create(valid);
  assert.equal(svc.get('1').status, 200);
  assert.equal(svc.get('99').status, 404);
  assert.equal(svc.get('abc').status, 404);
});

test('summary: total & rata-rata benar (data soal Q3)', () => {
  const { store, svc } = fresh();
  seed(store);
  const { data } = svc.summary({}).body;
  const sub02 = data.find((d) => d.subscriberId === 'SUB02');
  assert.equal(sub02.totalDataUsageMB, 11800);
  assert.equal(sub02.avgCallMinutes, 87.5);
  assert.equal(data.find((d) => d.subscriberId === 'SUB03').avgCallMinutes, 20);
});
