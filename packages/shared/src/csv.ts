export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  const cols = columns ?? (rows.length && rows[0] ? Object.keys(rows[0]) : []);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [cols.map(escape).join(',')];
  for (const r of rows) lines.push(cols.map((c) => escape(r[c])).join(','));
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): Record<string, string>[] {
  // minimal CSV parser (handles quoted fields)
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else field += ch;
    }
    i++;
  }
  if (field !== '' || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const firstRow = rows[0];
  if (!firstRow) return [];
  const header = firstRow.map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    if (row.every((c) => c === '')) continue;
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = row[idx] ?? ''; });
    out.push(obj);
  }
  return out;
}
