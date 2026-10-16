'use strict';

const cron = require('node-cron');
const { takeSnapshot } = require('./snapshot');
const { cleanup } = require('./cleanup');
const { TIMEZONE } = require('../src/lib/time');

const SNAPSHOT_CRON = process.env.SNAPSHOT_CRON || '0 8,12,15 * * *'; // 08:00, 12:00, 15:00
const CLEANUP_CRON = process.env.CLEANUP_CRON || '30 0 * * *'; // 00:30 setiap hari

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

cron.schedule(
  SNAPSHOT_CRON,
  async () => {
    try {
      const { file, rows } = await takeSnapshot();
      log(`snapshot saved: ${file} (${rows} rows)`);
    } catch (err) {
      log(`snapshot FAILED: ${err.message}`);
    }
  },
  { timezone: TIMEZONE }
);

cron.schedule(
  CLEANUP_CRON,
  async () => {
    try {
      const { deleted, kept } = await cleanup();
      log(`cleanup: deleted ${deleted.length}, kept ${kept}`);
    } catch (err) {
      log(`cleanup FAILED: ${err.message}`);
    }
  },
  { timezone: TIMEZONE }
);

log(`scheduler started (tz=${TIMEZONE}) snapshot="${SNAPSHOT_CRON}" cleanup="${CLEANUP_CRON}"`);
