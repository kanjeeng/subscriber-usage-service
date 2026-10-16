'use strict';

// Data contoh dari soal Q3 (timestamp dalam WIB).
const SAMPLE = [
  ['SUB01', 40, 10, 1500, '2025-08-01T08:00:00+07:00'],
  ['SUB01', 35, 8, 1200, '2025-08-01T12:00:00+07:00'],
  ['SUB02', 90, 20, 6000, '2025-08-01T08:00:00+07:00'],
  ['SUB02', 85, 18, 5800, '2025-08-01T12:00:00+07:00'],
  ['SUB03', 20, 5, 500, '2025-08-01T08:00:00+07:00'],
  ['SUB04', 150, 30, 9000, '2025-08-01T08:00:00+07:00'],
  ['SUB05', 70, 15, 5000, '2025-08-01T08:00:00+07:00'],
  ['SUB06', 25, 6, 700, '2025-08-01T08:00:00+07:00'],
];

function seed(store) {
  for (const [subscriberId, callMinutes, smsCount, dataUsageMB, ts] of SAMPLE) {
    store.add({ subscriberId, callMinutes, smsCount, dataUsageMB, timestamp: new Date(ts).toISOString() });
  }
  return SAMPLE.length;
}

module.exports = { seed };
