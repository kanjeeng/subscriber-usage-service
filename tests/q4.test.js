'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { getTotalUsageMB, getTotalUsageMBBuggy } = require('../q4/getTotalUsageMB');

const records = [{ dataUsageMB: 1500 }, { dataUsageMB: 1200 }, { dataUsageMB: 500 }];

test('versi buggy: mengembalikan undefined (bukan angka)', () => {
  assert.equal(getTotalUsageMBBuggy(records), undefined);
});

test('versi buggy: 1 record mengembalikan objek record; array kosong melempar TypeError', () => {
  assert.deepEqual(getTotalUsageMBBuggy([{ dataUsageMB: 5 }]), { dataUsageMB: 5 });
  assert.throws(() => getTotalUsageMBBuggy([]), TypeError);
});

test('fix: menjumlahkan dengan benar', () => {
  assert.equal(getTotalUsageMB(records), 3200);
});

test('fix: array kosong = 0, satu elemen = nilainya', () => {
  assert.equal(getTotalUsageMB([]), 0);
  assert.equal(getTotalUsageMB([{ dataUsageMB: 5 }]), 5);
});

test('fix: data kotor gagal dengan pesan jelas, bukan NaN diam-diam', () => {
  assert.throws(() => getTotalUsageMB([{ dataUsageMB: 1 }, {}]), /Invalid dataUsageMB/);
  assert.throws(() => getTotalUsageMB([{ dataUsageMB: 'abc' }]), /Invalid dataUsageMB/);
  assert.throws(() => getTotalUsageMB(null), TypeError);
});
