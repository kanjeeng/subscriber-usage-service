'use strict';

/** In-memory storage. Data hilang saat proses berhenti (sesuai ketentuan soal). */
class UsageStore {
  constructor() {
    this.records = [];
    this.nextId = 1;
  }

  add(data) {
    const record = { id: this.nextId++, ...data };
    this.records.push(record);
    return record;
  }

  getById(id) {
    return this.records.find((r) => r.id === id) || null;
  }

  list({ subscriberId, from, to } = {}) {
    return this.records.filter((r) => {
      if (subscriberId && r.subscriberId !== subscriberId) return false;
      const t = new Date(r.timestamp).getTime();
      if (from && t < from.getTime()) return false;
      if (to && t > to.getTime()) return false;
      return true;
    });
  }

  clear() {
    this.records = [];
    this.nextId = 1;
  }
}

module.exports = { UsageStore };
