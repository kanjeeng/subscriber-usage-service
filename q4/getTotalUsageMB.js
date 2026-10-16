'use strict';

/** Versi ASLI yang bermasalah — disimpan hanya untuk demonstrasi/test. */
function getTotalUsageMBBuggy(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB; // tidak ada `return` -> callback mengembalikan undefined
  });                            // tidak ada initial value -> total awal = objek record pertama
}

/** Versi PERBAIKAN. */
function getTotalUsageMB(records) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  return records.reduce((total, record) => {
    const mb = Number(record?.dataUsageMB);
    if (!Number.isFinite(mb)) {
      throw new TypeError(`Invalid dataUsageMB: ${JSON.stringify(record?.dataUsageMB)}`);
    }
    return total + mb;
  }, 0);
}

module.exports = { getTotalUsageMB, getTotalUsageMBBuggy };
