'use strict';

const TIMEZONE = 'Asia/Jakarta'; // WIB, UTC+7 (tanpa DST)

function wibParts(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
}

/** usage_snapshot_YYYY-MM-DD_HHmm.csv  (waktu WIB) */
function snapshotFileName(date = new Date()) {
  const p = wibParts(date);
  return `usage_snapshot_${p.year}-${p.month}-${p.day}_${p.hour}${p.minute}.csv`;
}

/** Kebalikan snapshotFileName. Mengembalikan Date, atau null jika nama tidak cocok. */
function parseSnapshotFileName(name) {
  const m = /^usage_snapshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})\.csv$/.exec(name);
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = { TIMEZONE, snapshotFileName, parseSnapshotFileName };
