import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export interface SheetPreview {
  name: string;
  headers: string[];
  previewRows: (string | number | null)[][];
  totalRows: number;
}
export interface ParsedFile {
  type: 'csv' | 'xlsx';
  sheets: SheetPreview[];
}

export async function parseImportFile(filePath: string): Promise<ParsedFile> {
  const ext = path.extname(filePath).toLowerCase();
  if (!fs.existsSync(filePath)) throw new Error('Файл не найден');

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse<string[]>(content, { skipEmptyLines: true });
    if (parsed.errors?.length) {
      throw new Error('Не удалось прочитать CSV: ' + parsed.errors[0].message);
    }
    const rows = parsed.data as string[][];
    if (rows.length === 0) throw new Error('CSV-файл пуст');
    const headers = rows[0];
    const body = rows.slice(1);
    return { type: 'csv', sheets: [{ name: 'CSV', headers, previewRows: body.slice(0, 20), totalRows: body.length }] };
  }

  if (ext === '.xlsx') {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.readFile(filePath);
    } catch (e: any) {
      throw new Error('Не удалось прочитать XLSX: файл повреждён или имеет неподдерживаемый формат');
    }
    const sheets: SheetPreview[] = wb.worksheets.map(ws => {
      const rows: (string | number | null)[][] = [];
      ws.eachRow(row => {
        const values = (row.values as any[]).slice(1).map(v => (v && typeof v === 'object' && 'text' in v ? v.text : v ?? null));
        rows.push(values);
      });
      const headers = (rows[0] || []).map(h => String(h ?? ''));
      const body = rows.slice(1);
      return { name: ws.name, headers, previewRows: body.slice(0, 20), totalRows: body.length };
    });
    if (sheets.length === 0) throw new Error('В книге не найдено ни одного листа');
    return { type: 'xlsx', sheets };
  }

  throw new Error('Поддерживаются только файлы .csv и .xlsx');
}

/** Полная загрузка выбранного листа (без ограничения preview) для подтверждённого импорта */
export async function loadFullSheet(filePath: string, sheetName?: string): Promise<{ headers: string[]; rows: (string | number | null)[][] }> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse<string[]>(content, { skipEmptyLines: true });
    const rows = parsed.data as string[][];
    return { headers: rows[0], rows: rows.slice(1) };
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = sheetName ? wb.getWorksheet(sheetName) : wb.worksheets[0];
  if (!ws) throw new Error('Лист не найден в книге');
  const rows: (string | number | null)[][] = [];
  ws.eachRow(row => {
    const values = (row.values as any[]).slice(1).map(v => (v && typeof v === 'object' && 'text' in v ? v.text : v ?? null));
    rows.push(values);
  });
  const headers = (rows[0] || []).map(h => String(h ?? ''));
  return { headers, rows: rows.slice(1) };
}