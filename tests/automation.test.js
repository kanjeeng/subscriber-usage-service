'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { UsageStore } = require('../src/store');
const { createService } = require('../src/service');
const { seed } = require('../src/seed');
const { snapshotFileName } = require('../src/lib/time');
const { takeSnapshot } = require('../scripts/snapshot');
const { cleanup } = require('../scripts/cleanup');

const tmp = () => fs.mkdtemp(path.join(os.tmpdir(), 'snap-'));

test('snapshot: ambil dari API (stub) dan tulis CSV bernama sesuai WIB', async () => {
  const store = new UsageStore();
  seed(store);
  const svc = createService(store);
  const server = http.createServer((req, res) => {
    const r = svc.list({});
    res.writeHead(r.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(r.body));
  });
  await new Promise((r) => server.listen(0, r));
  const dir = await tmp();
  try {
    const now = new Date('2026-10-16T08:00:00+07:00');
    const { file, rows } = await takeSnapshot({ apiUrl: `http://127.0.0.1:${server.address().port}`, dir, now });
    assert.equal(path.basename(file), 'usage_snapshot_2026-10-16_0800.csv');
    assert.equal(rows, 8);
    const lines = (await fs.readFile(file, 'utf8')).trim().split('\n');
    assert.equal(lines[0], 'id,subscriberId,callMinutes,smsCount,dataUsageMB,timestamp');
    assert.equal(lines.length, 9);
    assert.deepEqual(await fs.readdir(dir), ['usage_snapshot_2026-10-16_0800.csv']); // tidak ada .tmp tersisa
  } finally {
    server.close();
    await fs.rm(dir, { recursive: true });
  }
});

test('snapshot: API error -> reject & tidak membuat file', async () => {
  const dir = await tmp();
  try {
    const fetchImpl = async () => ({ ok: false, status: 500 });
    await assert.rejects(takeSnapshot({ dir, fetchImpl }), /HTTP 500/);
    assert.deepEqual(await fs.readdir(dir), []);
  } finally {
    await fs.rm(dir, { recursive: true });
  }
});

test('cleanup: hapus > 30 hari, pertahankan sisanya & file non-snapshot', async () => {
  const dir = await tmp();
  const now = new Date('2026-10-16T08:00:00+07:00');
  const ago = (days) => snapshotFileName(new Date(now.getTime() - days * 86_400_000));
  const names = [ago(40), ago(31), ago(30), ago(29), ago(0), 'notes.txt', 'usage_snapshot_bad.csv'];
  try {
    for (const n of names) await fs.writeFile(path.join(dir, n), 'x');

    const dry = await cleanup({ dir, now, dryRun: true });
    assert.equal(dry.deleted.length, 2);
    assert.equal((await fs.readdir(dir)).length, 7); // dry-run tidak menghapus

    const real = await cleanup({ dir, now });
    assert.deepEqual(real.deleted.sort(), [ago(40), ago(31)].sort());
    assert.equal(real.kept, 3); // 30 hari tepat tetap disimpan (aturan: > 30 hari)
    const left = (await fs.readdir(dir)).sort();
    assert.deepEqual(left, [ago(30), ago(29), ago(0), 'notes.txt', 'usage_snapshot_bad.csv'].sort());
  } finally {
    await fs.rm(dir, { recursive: true });
  }
});

test('cleanup: folder belum ada -> tidak error', async () => {
  const r = await cleanup({ dir: path.join(os.tmpdir(), 'tidak-ada-' + Date.now()) });
  assert.deepEqual(r, { deleted: [], kept: 0 });
});
