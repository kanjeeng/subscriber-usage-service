'use strict';

/** Escape satu sel CSV (RFC 4180) + guard sederhana terhadap CSV/formula injection. */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Ubah array of object menjadi string CSV dengan urutan kolom yang pasti. */
function toCsv(rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c])).join(','));
  }
  return lines.join('\n') + '\n';
}

module.exports = { toCsv, escapeCell };
