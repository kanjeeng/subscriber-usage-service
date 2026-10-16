'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { toCsv, escapeCell } = require('../src/lib/csv');
const { snapshotFileName, parseSnapshotFileName } = require('../src/lib/time');

test('csv: header saja untuk data kosong', () => {
  assert.equal(toCsv([], ['a', 'b']), 'a,b\n');
});

test('csv: escape koma, kutip, newline', () => {
  assert.equal(escapeCell('a,b'), '"a,b"');
  assert.equal(escapeCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCell('l1\nl2'), '"l1\nl2"');
  assert.equal(escapeCell(null), '');
});

test('csv: guard formula injection hanya untuk string', () => {
  assert.equal(escapeCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(escapeCell(-5), '-5');
});

test('time: nama file memakai WIB (UTC+7)', () => {
  assert.equal(snapshotFileName(new Date('2026-10-16T01:00:00Z')), 'usage_snapshot_2026-10-16_0800.csv');
  assert.equal(snapshotFileName(new Date('2026-10-16T08:00:00Z')), 'usage_snapshot_2026-10-16_1500.csv');
  // 17:30 UTC sudah hari berikutnya di WIB
  assert.equal(snapshotFileName(new Date('2026-10-16T17:30:00Z')), 'usage_snapshot_2026-10-17_0030.csv');
});

test('time: parse adalah kebalikan dari format; nama asing -> null', () => {
  const d = new Date('2026-10-16T05:00:00Z');
  assert.equal(parseSnapshotFileName(snapshotFileName(d)).getTime(), d.getTime());
  assert.equal(parseSnapshotFileName('notes.txt'), null);
  assert.equal(parseSnapshotFileName('usage_snapshot_2026-13-45_9999.csv'), null);
});
