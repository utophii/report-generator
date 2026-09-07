import ExcelJS from 'exceljs';
import fs from 'fs';
import { Report, Section, Field, TableValue, ChartValue } from '../../shared/types';

export async function exportReportToXlsx(report: Report, filePath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();

  const summary = wb.addWorksheet('Summary');
  summary.addRow(['Title', report.title]);
  summary.addRow(['Period', report.period]);
  summary.addRow(['Author', report.author]);
  summary.addRow(['Language', report.language]);
  summary.addRow([]);

  const textLines: string[] = [];
  const tableFields: { section: Section; field: Field }[] = [];
  const chartFields: { section: Section; field: Field }[] = [];

  for (const s of [...report.sections].sort((a, b) => a.order - b.order)) {
    for (const f of [...s.fields].sort((a, b) => a.order - b.order)) {
      if (f.type === 'table') tableFields.push({ section: s, field: f });
      else if (f.type === 'chart') chartFields.push({ section: s, field: f });
      else if ((f.type === 'textarea' || f.type === 'richtext') && f.value) {
        textLines.push(`## ${s.title} — ${f.label}`, String(f.value), '');
      } else if (f.type === 'list' && Array.isArray(f.value) && f.value.length) {
        textLines.push(`## ${s.title} — ${f.label}`, ...(f.value as string[]).map(i => `- ${i}`), '');
      } else if (['text', 'number', 'date', 'select'].includes(f.type) && f.value !== null && f.value !== undefined && String(f.value) !== '') {
        summary.addRow([`${s.title} — ${f.label}`, String(f.value)]);
      }
    }
  }

  if (textLines.length) {
    const textSheet = wb.addWorksheet('Text sections');
    textLines.forEach(line => textSheet.addRow([line]));
    textSheet.getColumn(1).width = 120;
  }

  let tableIndex = 1;
  for (const { section, field } of tableFields) {
    const t = field.value as TableValue;
    if (!t?.columns?.length) continue;
    const safeName = `Table ${tableIndex++} - ${section.title}`.slice(0, 31).replace(/[\[\]\*\/\\\?:]/g, '_');
    const ws = wb.addWorksheet(safeName);
    ws.addRow(t.columns.map(c => c.label));
    t.rows.forEach(r => ws.addRow(t.columns.map(c => r[c.key] ?? '')));
    ws.getRow(1).font = { bold: true };
    t.columns.forEach((c, idx) => { ws.getColumn(idx + 1).width = 20; });
  }

  for (const { field } of chartFields) {
    const c = field.value as ChartValue;
    if (c?.imagePath && fs.existsSync(c.imagePath)) {
      const ws = wb.addWorksheet(`Chart - ${c.title}`.slice(0, 31).replace(/[\[\]\*\/\\\?:]/g, '_'));
      const imgId = wb.addImage({ filename: c.imagePath, extension: 'png' });
      ws.addImage(imgId, 'A1:H15');
    }
  }

  await wb.xlsx.writeFile(filePath);
}