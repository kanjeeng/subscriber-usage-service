'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { parseSnapshotFileName } = require('../src/lib/time');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hapus snapshot CSV yang lebih tua dari `retentionDays` hari.
 * Umur dihitung dari timestamp di NAMA file (bukan mtime), sehingga tetap benar
 * walau file pernah disalin/di-restore. Hanya file ber-pola snapshot yang disentuh.
 */
async function cleanup({
  dir = process.env.SNAPSHOT_DIR || path.join(__dirname, '..', 'snapshots'),
  retentionDays,
  now = new Date(),
  dryRun = false,
} = {}) {
  const days = retentionDays ?? Number(process.env.RETENTION_DAYS) ?? 30;

  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return { deleted: [], kept: 0 };
    throw err;
  }

  const cutoff = now.getTime() - days * DAY_MS;
  const deleted = [];
  let kept = 0;

  for (const name of entries) {
    const fileTime = parseSnapshotFileName(name);
    if (!fileTime) continue; // bukan file snapshot -> jangan disentuh
    if (fileTime.getTime() < cutoff) {
      if (!dryRun) await fs.unlink(path.join(dir, name));
      deleted.push(name);
    } else {
      kept += 1;
    }
  }
  return { deleted, kept };
}

module.exports = { cleanup };

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const daysArg = args.find((a) => a.startsWith('--days='));
  
  const retentionDays = daysArg !== undefined ? Number(daysArg.split('=')[1]) : undefined;

  cleanup({ dryRun, ...(retentionDays !== undefined ? { retentionDays } : {}) })
    .then(({ deleted, kept }) => {
      const verb = dryRun ? 'would delete' : 'deleted';
      console.log(`[${new Date().toISOString()}] cleanup: ${verb} ${deleted.length}, kept ${kept}`);
      deleted.forEach((f) => console.log(`  - ${f}`));
    })
    .catch((err) => {
      console.error(`[${new Date().toISOString()}] cleanup FAILED: ${err.message}`);
      process.exit(1);
    });
}