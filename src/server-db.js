'use strict';

const path = require('node:path');
const express = require('express');
const { Pool } = require('pg');
const { validateUsage } = require('./validation');

const PORT = Number(process.env.PORT) || 4000;

/**
 * Fungsi helper untuk membersihkan variabel dari karakter tak terlihat / BOM.
 */
const sanitize = (val, defaultVal) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  return String(val)
    .replace(/[\u00A0\u200B\uFEFF]/g, '')
    .trim();
};

const dbConfig = {
  host: sanitize(process.env.DB_HOST, '127.0.0.1'),
  port: Number(process.env.DB_PORT) || 5432,
  user: sanitize(process.env.DB_USER, 'postgres'),
  password: sanitize(process.env.DB_PASSWORD, 'secret'),
  database: sanitize(process.env.DB_NAME, 'subscriber_db'),
};

const pool = new Pool(dbConfig);

function createDbApp() {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // POST /api/usage - Catat usage baru ke database PostgreSQL
  app.post('/api/usage', async (req, res) => {
    try {
      const { errors, value } = validateUsage(req.body);
      if (errors.length) {
        return res.status(400).json({ error: 'ValidationError', details: errors });
      }

      const query = `
        INSERT INTO subscriber_usage (subscriber_id, call_minutes, sms_count, data_usage_mb, recorded_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [
        value.subscriberId,
        value.callMinutes,
        value.smsCount,
        value.dataUsageMB,
        value.timestamp,
      ];

      const { rows } = await pool.query(query, values);
      const r = rows[0];
      const data = {
        id: Date.now(),
        subscriberId: r.subscriber_id,
        callMinutes: r.call_minutes,
        smsCount: r.sms_count,
        dataUsageMB: r.data_usage_mb,
        timestamp: new Date(r.recorded_at).toISOString(),
      };

      return res.status(201).json({ data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  });

  // GET /api/usage/summary - Ringkasan per subscriber langsung dari database
  app.get('/api/usage/summary', async (req, res) => {
    try {
      const subscriberId = req.query.subscriberId;
      let query = `
        SELECT 
          subscriber_id AS "subscriberId",
          COUNT(*)::int AS "snapshots",
          SUM(call_minutes)::int AS "totalCallMinutes",
          SUM(sms_count)::int AS "totalSmsCount",
          SUM(data_usage_mb)::int AS "totalDataUsageMB",
          AVG(call_minutes)::float AS "avgCallMinutes"
        FROM subscriber_usage
      `;
      const params = [];
      if (subscriberId) {
        query += ` WHERE subscriber_id = $1`;
        params.push(subscriberId);
      }
      query += ` GROUP BY subscriber_id ORDER BY subscriber_id ASC`;

      const { rows } = await pool.query(query, params);
      return res.status(200).json({ count: rows.length, data: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  });

  // GET /api/usage/:id - Ambil satu record
  app.get('/api/usage/:id', async (req, res) => {
    try {
      const allRows = await fetchAllUsage();
      const targetId = Number(req.params.id);
      const record = allRows.find((r) => r.id === targetId);
      if (!record) {
        return res.status(404).json({ error: 'NotFound', message: `Usage record ${req.params.id} tidak ditemukan` });
      }
      return res.status(200).json({ data: record });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  });

  // GET /api/usage - Daftar seluruh record dengan filter opsional
  app.get('/api/usage', async (req, res) => {
    try {
      const { subscriberId, from, to } = req.query;
      let data = await fetchAllUsage();

      if (subscriberId) {
        data = data.filter((r) => r.subscriberId === subscriberId);
      }
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          data = data.filter((r) => new Date(r.timestamp).getTime() >= fromDate.getTime());
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          data = data.filter((r) => new Date(r.timestamp).getTime() <= toDate.getTime());
        }
      }

      return res.status(200).json({ count: data.length, data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  });

  // Frontend statis
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use((req, res) => res.status(404).json({ error: 'NotFound' }));

  return app;
}

async function fetchAllUsage() {
  const { rows } = await pool.query('SELECT * FROM subscriber_usage ORDER BY recorded_at ASC');
  return rows.map((r, idx) => ({
    id: idx + 1,
    subscriberId: r.subscriber_id,
    callMinutes: r.call_minutes,
    smsCount: r.sms_count,
    dataUsageMB: r.data_usage_mb,
    timestamp: new Date(r.recorded_at).toISOString(),
  }));
}

// Koneksi ke database lalu jalankan server
pool.connect()
  .then(() => {
    console.log('Connected to relational database successfully.');
    const app = createDbApp();
    app.listen(PORT, () => {
      console.log(`Subscriber Usage API (Database Mode) listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });