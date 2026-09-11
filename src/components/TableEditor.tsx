import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { TableValue } from '@shared/types';
import ImportDialog from './ImportDialog';

export default function TableEditor({ value, onChange }: { value: TableValue; onChange: (v: TableValue) => void }) {
  const [importOpen, setImportOpen] = useState(false);
  const v = (value && typeof value === 'object' && Array.isArray((value as any).columns))
    ? value
    : { columns: [], rows: [] };

  function addColumn() {
    const key = `col_${uuid().slice(0, 6)}`;
    onChange({ ...v, columns: [...v.columns, { key, label: 'Новый столбец', numeric: false }] });
  }
  function addRow() {
    const row: Record<string, any> = {};
    v.columns.forEach(c => (row[c.key] = c.numeric ? 0 : ''));
    onChange({ ...v, rows: [...v.rows, row] });
  }
  function removeColumn(key: string) {
    onChange({ ...v, columns: v.columns.filter(c => c.key !== key), rows: v.rows.map(r => { const { [key]: _, ...rest } = r; return rest; }) });
  }
  function removeRow(idx: number) {
    onChange({ ...v, rows: v.rows.filter((_, i) => i !== idx) });
  }
  function updateCell(idx: number, key: string, val: any) {
    const rows = [...v.rows];
    rows[idx] = { ...rows[idx], [key]: val };
    onChange({ ...v, rows });
  }
  function renameColumn(key: string, label: string) {
    onChange({ ...v, columns: v.columns.map(c => c.key === key ? { ...c, label } : c) });
  }
  function toggleNumeric(key: string) {
    onChange({ ...v, columns: v.columns.map(c => c.key === key ? { ...c, numeric: !c.numeric } : c) });
  }

  return (
    <div className="table-editor">
      <div className="table-toolbar">
        <button onClick={addColumn}>+ столбец</button>
        <button onClick={addRow}>+ строка</button>
        <button onClick={() => setImportOpen(true)}>Импортировать CSV/XLSX</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {v.columns.map(c => (
                <th key={c.key}>
                  <input value={c.label} onChange={e => renameColumn(c.key, e.target.value)} />
                  <label className="numeric-toggle"><input type="checkbox" checked={c.numeric} onChange={() => toggleNumeric(c.key)} /> число</label>
                  <button onClick={() => removeColumn(c.key)}>✕</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.rows.map((row, idx) => (
              <tr key={idx}>
                {v.columns.map(c => (
                  <td key={c.key}>
                    <input value={row[c.key] ?? ''} onChange={e => updateCell(idx, c.key, c.numeric ? Number(e.target.value) : e.target.value)} />
                  </td>
                ))}
                <td><button onClick={() => removeRow(idx)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {importOpen && (
        <ImportDialog
          onClose={() => setImportOpen(false)}
          onImport={(columns, rows, meta) => { onChange({ columns, rows, sourceFileMeta: meta }); setImportOpen(false); }}
        />
      )}
    </div>
  );
}