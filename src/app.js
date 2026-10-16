'use strict';

const path = require('node:path');
const express = require('express');
const { UsageStore } = require('./store');
const { createService } = require('./service');

function createApp({ store = new UsageStore() } = {}) {
  const app = express();
  const service = createService(store);
  const send = (res, r) => res.status(r.status).json(r.body);

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.post('/api/usage', (req, res) => send(res, service.create(req.body)));
  // /summary harus didaftarkan SEBELUM /:id agar tidak dianggap sebagai id.
  app.get('/api/usage/summary', (req, res) => send(res, service.summary(req.query)));
  app.get('/api/usage/:id', (req, res) => send(res, service.get(req.params.id)));
  app.get('/api/usage', (req, res) => send(res, service.list(req.query)));

  // Frontend sederhana (bonus)
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use((req, res) => res.status(404).json({ error: 'NotFound' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'InvalidJSON', message: 'Body bukan JSON yang valid' });
    }
    console.error(err);
    return res.status(500).json({ error: 'InternalServerError' });
  });

  return app;
}

module.exports = { createApp };
