import { Field, Section, TableValue, ImageValue } from './types';

const MAX_TABLE_ROWS = 30;

function fieldToText(f: Field): string | null {
  const v = f.value;
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'select':
    case 'date':
      return typeof v === 'string' && v.trim() ? `${f.label}: ${v.trim()}` : null;
    case 'number':
      return v === null || v === undefined || v === '' ? null : `${f.label}: ${v}`;
    case 'list': {
      const items = (Array.isArray(v) ? v : []).map(s => s.trim()).filter(Boolean);
      return items.length ? `${f.label}:\n${items.map(i => `- ${i}`).join('\n')}` : null;
    }
    case 'table': {
      const t = v as TableValue | null;
      if (!t?.columns?.length || !t.rows?.length) return null;
      const header = t.columns.map(c => c.label).join(' | ');
      const rows = t.rows.slice(0, MAX_TABLE_ROWS).map(r => t.columns.map(c => r[c.key] ?? '').join(' | '));
      if (t.rows.length > MAX_TABLE_ROWS) rows.push(`… (+${t.rows.length - MAX_TABLE_ROWS})`);
      return `${f.label}:\n${header}\n${rows.join('\n')}`;
    }
    case 'image': {
      const caption = (v as ImageValue | null)?.caption?.trim();
      return caption ? `${f.label}: [${caption}]` : null;
    }
    default:
      return null;
  }
}

export function reportToText(sections: Section[], opts: { excludeFieldId?: string; maxChars?: number } = {}): string {
  const { excludeFieldId, maxChars = 12000 } = opts;
  const parts: string[] = [];
  for (const s of [...sections].sort((a, b) => a.order - b.order)) {
    const body = [...s.fields]
      .sort((a, b) => a.order - b.order)
      .filter(f => f.id !== excludeFieldId)
      .map(fieldToText)
      .filter((x): x is string => !!x);
    if (!body.length) continue;
    parts.push(`${'#'.repeat(s.level)} ${s.title}\n${body.join('\n')}`);
  }
  const text = parts.join('\n\n');
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…` : text;
}
