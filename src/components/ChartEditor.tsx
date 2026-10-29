import React, { useMemo } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartValue, Language, Section } from '@shared/types';
import { buildChartData, chartOptions, chartProblem, findChartTable } from '@shared/chartData';

ChartJS.register(...registerables);

interface Props {
  value: ChartValue;
  onChange: (v: ChartValue) => void;
  reportSections: Section[];
  lang: Language;
}

export default function ChartEditor({ value, onChange, reportSections, lang }: Props) {
  const ru = lang === 'ru';
  const v = value ?? { sourceFieldId: null, chartType: 'bar', title: '', categoryColumn: null, valueColumns: [], showLegend: true };

  const allTableFields = useMemo(() =>
    reportSections.flatMap(s => s.fields.filter(f => f.type === 'table').map(f => ({ id: f.id, label: `${s.title} / ${f.label}` }))),
    [reportSections]);

  const table = findChartTable(reportSections, v.sourceFieldId);
  const numericCols = table?.columns.filter(c => c.numeric) ?? [];
  const chartData = useMemo(() => buildChartData(v, reportSections), [v, reportSections]);
  const problem = chartProblem(v, table, lang);

  return (
    <div className="chart-editor">
      <select value={v.sourceFieldId ?? ''} onChange={e => onChange({ ...v, sourceFieldId: e.target.value || null, categoryColumn: null, valueColumns: [] })}>
        <option value="">{ru ? 'Таблица-источник…' : 'Source table…'}</option>
        {allTableFields.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>

      {table && (
        <>
          <select value={v.categoryColumn ?? ''} onChange={e => onChange({ ...v, categoryColumn: e.target.value || null })}>
            <option value="">{ru ? 'Категория (ось X)…' : 'Category (X axis)…'}</option>
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
        <option value="bar">{ru ? 'Столбчатая' : 'Bar'}</option>
        <option value="line">{ru ? 'Линейная' : 'Line'}</option>
        <option value="pie">{ru ? 'Круговая' : 'Pie'}</option>
      </select>
      <input placeholder={ru ? 'Заголовок диаграммы' : 'Chart title'} value={v.title} onChange={e => onChange({ ...v, title: e.target.value })} />
      <label><input type="checkbox" checked={v.showLegend} onChange={e => onChange({ ...v, showLegend: e.target.checked })} /> {ru ? 'Легенда' : 'Legend'}</label>

      {chartData ? (
        <div style={{ maxWidth: 480 }}>
          <Chart type={v.chartType} data={chartData as any} options={chartOptions(v)} />
        </div>
      ) : problem && <div className="hint">{problem}</div>}
    </div>
  );
}