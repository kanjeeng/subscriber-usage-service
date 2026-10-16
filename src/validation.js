'use strict';

const NUMERIC_FIELDS = ['callMinutes', 'smsCount', 'dataUsageMB'];

/**
 * Validasi body POST /api/usage.
 * @returns {{errors: string[], value?: object}}
 */
function validateUsage(body) {
  const errors = [];
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body harus berupa JSON object'] };
  }

  const { subscriberId } = body;
  if (typeof subscriberId !== 'string' || subscriberId.trim() === '') {
    errors.push('subscriberId wajib diisi (string tidak kosong)');
  }

  for (const field of NUMERIC_FIELDS) {
    const v = body[field];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      errors.push(`${field} wajib berupa angka`);
    } else if (v < 0) {
      errors.push(`${field} tidak boleh negatif`);
    }
  }
  if (typeof body.smsCount === 'number' && !Number.isInteger(body.smsCount)) {
    errors.push('smsCount harus bilangan bulat');
  }

  let timestamp = new Date().toISOString();
  if (body.timestamp !== undefined) {
    const t = new Date(body.timestamp);
    if (typeof body.timestamp !== 'string' || Number.isNaN(t.getTime())) {
      errors.push('timestamp harus string tanggal ISO-8601 yang valid');
    } else {
      timestamp = t.toISOString();
    }
  }

  if (errors.length) return { errors };
  return {
    errors,
    value: {
      subscriberId: subscriberId.trim(),
      callMinutes: body.callMinutes,
      smsCount: body.smsCount,
      dataUsageMB: body.dataUsageMB,
      timestamp,
    },
  };
}

module.exports = { validateUsage };
