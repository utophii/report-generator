import React, { useState } from 'react';
import { api } from '../api/bridge';
import { TableColumn } from '@shared/types';
import { v4 as uuid } from 'uuid';

interface Props {
  onClose: () => void;
  onImport: (columns: TableColumn[], rows: Record<string, any>[], meta: { fileName: string; sheet?: string; importedAt: string }) => void;
}

export default function ImportDialog({ onClose, onImport }: Props) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [sheetName, setSheetName] = useState<string>('');
  const [includedCols, setIncludedCols] = useState<Set<number>>(new Set());

  async function pickFile() {
    setError(null);
    const p = await api.dialogs.openImportFile();
    if (!p) return;
    setFilePath(p);
    const res = await api.importFile.parse(p);
    if (!res.ok) { setError(res.error); return; }
    setParsed(res.data);
    setSheetName(res.data.sheets[0].name);
    setIncludedCols(new Set(res.data.sheets[0].headers.map((_: any, i: number) => i)));
  }

  async function confirmImport() {
    if (!filePath || !parsed) return;
    const res = await api.importFile.loadFullSheet(filePath, parsed.type === 'xlsx' ? sheetName : undefined);
    if (!res.ok) { setError(res.error); return; }
    const activeSheet = parsed.sheets.find((s: any) => s.name === sheetName) ?? parsed.sheets[0];
    const headers: string[] = res.data.headers;
    const cols: TableColumn[] = headers
      .map((h, i) => ({ i, h }))
      .filter(({ i }) => includedCols.has(i))
      .map(({ h, i }) => ({ key: `col_${i}_${uuid().slice(0, 4)}`, label: h || `Column ${i + 1}`, numeric: res.data.rows.every((r: any[]) => r[i] === null || r[i] === '' || !isNaN(Number(r[i]))) }));
    const rows = res.data.rows.map((r: any[]) => {
      const obj: Record<string, any> = {};
      cols.forEach((c, ci) => {
        const origIndex = [...includedCols][ci];
        obj[c.key] = r[origIndex] ?? '';
      });
      return obj;
    });
    onImport(cols, rows, { fileName: filePath.split(/[\\/]/).pop() || filePath, sheet: sheetName, importedAt: new Date().toISOString() });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()}>
        <h3>Импорт таблицы</h3>
        {error && <div className="error-banner">{error}</div>}
        {!parsed && <button onClick={pickFile}>Выбрать файл CSV/XLSX</button>}
        {parsed && (
          <>
            {parsed.type === 'xlsx' && (
              <select value={sheetName} onChange={e => { setSheetName(e.target.value); setIncludedCols(new Set(parsed.sheets.find((s: any) => s.name === e.target.value).headers.map((_: any, i: number) => i))); }}>
                {parsed.sheets.map((s: any) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            )}
            <div className="import-preview">
              <table>
                <thead>
                  <tr>
                    {parsed.sheets.find((s: any) => s.name === sheetName)?.headers.map((h: string, i: number) => (
                      <th key={i}>
                        <label><input type="checkbox" checked={includedCols.has(i)} onChange={() => {
                          const s = new Set(includedCols);
                          s.has(i) ? s.delete(i) : s.add(i);
                          setIncludedCols(s);
                        }} /> {h || `Col ${i + 1}`}</label>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.sheets.find((s: any) => s.name === sheetName)?.previewRows.map((row: any[], ri: number) => (
                    <tr key={ri}>{row.map((c, ci) => <td key={ci}>{String(c ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              <div className="hint">Показаны первые строки. Всего строк: {parsed.sheets.find((s: any) => s.name === sheetName)?.totalRows}</div>
            </div>
            <div className="modal-actions">
              <button onClick={onClose}>Отмена</button>
              <button className="primary" onClick={confirmImport}>Импортировать</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}