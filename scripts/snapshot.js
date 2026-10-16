'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { toCsv } = require('../src/lib/csv');
const { snapshotFileName } = require('../src/lib/time');

const COLUMNS = ['id', 'subscriberId', 'callMinutes', 'smsCount', 'dataUsageMB', 'timestamp'];

/**
 * Ambil seluruh data usage dari API lalu simpan sebagai CSV.
 * Penulisan atomik (tulis ke .tmp lalu rename) agar tidak ada CSV setengah jadi.
 */
async function takeSnapshot({
  apiUrl = process.env.API_URL,
  dir = process.env.SNAPSHOT_DIR || path.join(__dirname, '..', 'snapshots'),
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const res = await fetchImpl(`${apiUrl}/api/usage`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`API responded with HTTP ${res.status}`);
  const { data } = await res.json();

  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, snapshotFileName(now));
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, toCsv(data, COLUMNS), 'utf8');
  await fs.rename(tmp, file);
  return { file, rows: data.length };
}

module.exports = { takeSnapshot, COLUMNS };

if (require.main === module) {
  takeSnapshot()
    .then(({ file, rows }) => console.log(`[${new Date().toISOString()}] snapshot saved: ${file} (${rows} rows)`))
    .catch((err) => {
      console.error(`[${new Date().toISOString()}] snapshot FAILED: ${err.message}`);
      process.exit(1);
    });
}
