'use strict';

const { validateUsage } = require('./validation');

function parseDate(value) {
  if (value === undefined) return { date: undefined };
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? { error: true } : { date: d };
}

/**
 * Logika bisnis dipisah dari Express supaya mudah diuji.
 * Setiap method mengembalikan { status, body }.
 */
function createService(store) {
  return {
    create(body) {
      const { errors, value } = validateUsage(body);
      if (errors.length) {
        return { status: 400, body: { error: 'ValidationError', details: errors } };
      }
      return { status: 201, body: { data: store.add(value) } };
    },

    list(query = {}) {
      const from = parseDate(query.from);
      const to = parseDate(query.to);
      if (from.error || to.error) {
        return {
          status: 400,
          body: { error: 'ValidationError', details: ['from/to harus tanggal ISO-8601 yang valid'] },
        };
      }
      const data = store.list({ subscriberId: query.subscriberId, from: from.date, to: to.date });
      return { status: 200, body: { count: data.length, data } };
    },

    get(rawId) {
      const id = Number(rawId);
      const record = Number.isInteger(id) ? store.getById(id) : null;
      if (!record) return { status: 404, body: { error: 'NotFound', message: `Usage record ${rawId} tidak ditemukan` } };
      return { status: 200, body: { data: record } };
    },

    summary(query = {}) {
      const rows = store.list({ subscriberId: query.subscriberId });
      const bySub = new Map();
      for (const r of rows) {
        const s = bySub.get(r.subscriberId) || {
          subscriberId: r.subscriberId,
          snapshots: 0,
          totalCallMinutes: 0,
          totalSmsCount: 0,
          totalDataUsageMB: 0,
        };
        s.snapshots += 1;
        s.totalCallMinutes += r.callMinutes;
        s.totalSmsCount += r.smsCount;
        s.totalDataUsageMB += r.dataUsageMB;
        bySub.set(r.subscriberId, s);
      }
      const data = [...bySub.values()]
        .map((s) => ({ ...s, avgCallMinutes: s.totalCallMinutes / s.snapshots }))
        .sort((a, b) => a.subscriberId.localeCompare(b.subscriberId));
      return { status: 200, body: { count: data.length, data } };
    },
  };
}

module.exports = { createService };
