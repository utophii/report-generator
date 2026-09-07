import React, { useMemo, useRef, useState } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartValue, Section, TableValue } from '@shared/types';
import { api } from '../api/bridge';

ChartJS.register(...registerables);

interface Props {
  value: ChartValue;
  onChange: (v: ChartValue) => void;
  reportSections: Section[];
}

function findTableField(sections: Section[], fieldId: string | null) {
  if (!fieldId) return null;
  for (const s of sections) {
    const f = s.fields.find(f => f.id === fieldId && f.type === 'table');
    if (f) return { section: s, table: f.value as TableValue };
  }
  return null;
}

export default function ChartEditor({ value, onChange, reportSections }: Props) {
  const canvasRef = useRef<ChartJS>(null);
  const v = value ?? { sourceFieldId: null, chartType: 'bar', title: '', categoryColumn: null, valueColumns: [], showLegend: true };
  const [error, setError] = useState<string | null>(null);

  const allTableFields = useMemo(() =>
    reportSections.flatMap(s => s.fields.filter(f => f.type === 'table').map(f => ({ id: f.id, label: `${s.title} / ${f.label}` }))),
    [reportSections]);

  const found = findTableField(reportSections, v.sourceFieldId);
  const table = found?.table;
  const numericCols = table?.columns.filter(c => c.numeric) ?? [];

  const chartData = useMemo(() => {
    if (!table || !v.categoryColumn || v.valueColumns.length === 0) return null;
    const labels = table.rows.map(r => String(r[v.categoryColumn!] ?? ''));
    const datasets = v.valueColumns.map((key, idx) => ({
      label: table.columns.find(c => c.key === key)?.label ?? key,
      data: table.rows.map(r => Number(r[key]) || 0),
      backgroundColor: `hsl(${(idx * 67) % 360}, 65%, 55%)`
    }));
    return { labels, datasets };
  }, [table, v.categoryColumn, v.valueColumns]);

  function canBuild() {
    if (!table || table.rows.length === 0) return 'Нет данных: выберите таблицу с заполненными строками.';
    if (numericCols.length === 0) return 'В таблице нет числовых столбцов.';
    if (!v.categoryColumn) return 'Выберите столбец категорий (ось X).';
    if (v.valueColumns.length === 0) return 'Выберите хотя бы один числовой столбец значений.';
    return null;
  }

  async function saveImage() {
    setError(null);
    const problem = canBuild();
    if (problem) { setError(problem); return; }
    const chartInstance = canvasRef.current;
    if (!chartInstance) return;
    const dataUrl = chartInstance.toBase64Image('image/png', 1);
    const path = await api.images.saveDataUrl(dataUrl);
    onChange({ ...v, imagePath: path });
  }

  return (
    <div className="chart-editor">
      <select value={v.sourceFieldId ?? ''} onChange={e => onChange({ ...v, sourceFieldId: e.target.value || null, categoryColumn: null, valueColumns: [] })}>
        <option value="">Таблица-источник…</option>
        {allTableFields.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      {table && (
        <>
          <select value={v.categoryColumn ?? ''} onChange={e => onChange({ ...v, categoryColumn: e.target.value || null })}>
            <option value="">Категория (ось X)…</option>
            {table.columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <div className="checkbox-group">
            {numericCols.map(c => (
              <label key={c.key}>
                <input type="checkbox" checked={v.valueColumns.includes(c.key)}
                  onChange={e => onChange({ ...v, valueColumns: e.target.checked ? [...v.valueColumns, c.key] : v.valueColumns.filter(k => k !== c.key) })} />
                {c.label}
              </label>
            ))}
          </div>
        </>
      )}

      <select value={v.chartType} onChange={e => onChange({ ...v, chartType: e.target.value as any })}>
        <option value="bar">Столбчатая</option><option value="line">Линейная</option><option value="pie">Круговая</option>
      </select>
      <input placeholder="Заголовок диаграммы" value={v.title} onChange={e => onChange({ ...v, title: e.target.value })} />
      <label><input type="checkbox" checked={v.showLegend} onChange={e => onChange({ ...v, showLegend: e.target.checked })} /> Легенда</label>

      {error && <div className="error-banner">{error}</div>}

      {chartData && (
        <div style={{ maxWidth: 480 }}>
          <Chart ref={canvasRef as any} type={v.chartType} data={chartData}
            options={{ plugins: { legend: { display: v.showLegend }, title: { display: !!v.title, text: v.title } } }} />
        </div>
      )}
      <button onClick={saveImage}>Сохранить изображение диаграммы (для экспорта)</button>
      {v.imagePath && <div className="hint">Изображение сохранено ✓</div>}
    </div>
  );
}