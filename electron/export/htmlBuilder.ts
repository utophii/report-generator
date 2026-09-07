import { Report, Section, Field, TableValue, ChartValue, ImageValue } from '../../shared/types';
import { THEMES } from '../../shared/themes';
import fs from 'fs';

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function renderList(items: string[]): string {
  return `<ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function renderTable(t: TableValue): string {
  const head = t.columns.map(c => `<th>${esc(c.label)}</th>`).join('');
  const body = t.rows.map(row => `<tr>${t.columns.map(c => {
    const v = row[c.key];
    const formatted = c.numeric && c.format === 'percent' && typeof v === 'number' ? `${v}%` : v ?? '';
    return `<td>${esc(String(formatted))}</td>`;
  }).join('')}</tr>`).join('');
  return `<table class="rg-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function imgDataUrl(absPath: string): string | null {
  try {
    const buf = fs.readFileSync(absPath);
    const ext = absPath.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function renderField(f: Field): string {
  switch (f.type) {
    case 'text': return f.value ? `<p><strong>${esc(f.label)}:</strong> ${esc(String(f.value))}</p>` : '';
    case 'number': return f.value !== null && f.value !== undefined ? `<p><strong>${esc(f.label)}:</strong> ${esc(String(f.value))}</p>` : '';
    case 'date': return f.value ? `<p><strong>${esc(f.label)}:</strong> ${esc(String(f.value))}</p>` : '';
    case 'select': return f.value ? `<p><strong>${esc(f.label)}:</strong> ${esc(String(f.value))}</p>` : '';
    case 'textarea':
    case 'richtext': {
      if (!f.value) return '';
      const text = String(f.value);
      const paragraphs = text.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br/>')}</p>`).join('');
      return `<h4>${esc(f.label)}</h4>${paragraphs}`;
    }
    case 'list': {
      const items = (f.value as string[]) || [];
      if (items.length === 0) return '';
      return `<h4>${esc(f.label)}</h4>${renderList(items)}`;
    }
    case 'table': {
      const t = f.value as TableValue;
      if (!t || t.rows.length === 0) return '';
      return `<h4>${esc(f.label)}</h4>${renderTable(t)}`;
    }
    case 'image': {
      const img = f.value as ImageValue | null;
      if (!img?.path) return '';
      const data = imgDataUrl(img.path);
      if (!data) return '';
      return `<figure><img src="${data}" style="max-width:100%"/>${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ''}</figure>`;
    }
    case 'chart': {
      const c = f.value as ChartValue;
      if (!c?.imagePath) return '';
      const data = imgDataUrl(c.imagePath);
      if (!data) return '';
      return `<figure><img src="${data}" style="max-width:100%"/><figcaption>${esc(c.title)}</figcaption></figure>`;
    }
  }
  return '';
}

function sectionHasContent(s: Section): boolean {
  return s.fields.some(f => {
    if (f.type === 'list') return ((f.value as string[]) || []).length > 0;
    if (f.type === 'table') return ((f.value as TableValue)?.rows?.length || 0) > 0;
    if (f.type === 'image') return !!(f.value as ImageValue)?.path;
    if (f.type === 'chart') return !!(f.value as ChartValue)?.imagePath;
    return f.value !== null && f.value !== undefined && String(f.value).trim() !== '';
  });
}

function renderSection(s: Section, depth = 0): string {
  if (!s.required && !sectionHasContent(s)) return '';
  const tag = `h${Math.min(6, s.level + 1)}`;
  const body = s.fields.sort((a, b) => a.order - b.order).map(renderField).join('');
  return `<section class="rg-section"><${tag}>${esc(s.title)}</${tag}>${s.hint ? `<p class="rg-hint">${esc(s.hint)}</p>` : ''}${body}</section>`;
}

export function buildReportHtml(report: Report): string {
  const theme = THEMES[report.theme];
  const toc = report.sections.filter(s => s.showInToc && (s.required || sectionHasContent(s)))
    .map(s => `<li>${esc(s.title)}</li>`).join('');
  const sectionsHtml = [...report.sections].sort((a, b) => a.order - b.order).map(s => renderSection(s)).join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    body { font-family: ${theme.fontFamily}; color: ${theme.textColor}; margin: 40px; }
    h1, h2, h3, h4 { color: ${theme.headingColor}; }
    .rg-cover { text-align:center; padding: 80px 0; background: ${theme.coverBackground}; }
    .rg-cover h1 { font-size: 32px; }
    .rg-cover .meta { color: ${theme.accentColor}; margin-top: 10px; }
    .rg-section { margin-bottom: 24px; page-break-inside: avoid; }
    .rg-hint { color: #777; font-size: 12px; }
    table.rg-table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    table.rg-table th, table.rg-table td { border: 1px solid ${theme.borderColor}; padding: 6px 8px; font-size: 13px; }
    table.rg-table th { background: ${theme.tableHeaderBg}; }
    .rg-toc { margin: 30px 0; }
    figure { margin: 16px 0; text-align: center; }
    figcaption { font-size: 12px; color: #666; }
  </style></head><body>
    <div class="rg-cover">
      <h1>${esc(report.title)}</h1>
      <div class="meta">${esc(report.period)} ${report.author ? '· ' + esc(report.author) : ''}</div>
    </div>
    <div class="rg-toc"><h3>${report.language === 'ru' ? 'Содержание' : 'Contents'}</h3><ol>${toc}</ol></div>
    ${sectionsHtml}
  </body></html>`;
}