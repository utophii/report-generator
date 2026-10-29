import { ChartValue, Language, Section, TableValue } from './types';

export interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[]; backgroundColor: string | string[]; borderColor?: string }[];
}

export const CHART_EXPORT_WIDTH = 1200;
export const CHART_EXPORT_HEIGHT = 700;

const color = (i: number) => `hsl(${(i * 67) % 360}, 65%, 55%)`;

export function findChartTable(sections: Section[], fieldId: string | null): TableValue | null {
  if (!fieldId) return null;
  for (const s of sections) {
    const f = s.fields.find(f => f.id === fieldId && f.type === 'table');
    if (f) return f.value as TableValue;
  }
  return null;
}

export function chartProblem(v: ChartValue | null, table: TableValue | null, lang: Language): string | null {
  const ru = lang === 'ru';
  if (!table || !table.rows?.length) return ru ? 'Нет данных: выберите таблицу с заполненными строками.' : 'No data: choose a table with filled rows.';
  if (!table.columns.some(c => c.numeric)) return ru ? 'В таблице нет числовых столбцов.' : 'The table has no numeric columns.';
  if (!v?.categoryColumn) return ru ? 'Выберите столбец категорий (ось X).' : 'Choose a category column (X axis).';
  if (!v.valueColumns.length) return ru ? 'Выберите хотя бы один числовой столбец значений.' : 'Choose at least one numeric value column.';
  return null;
}

export function buildChartData(v: ChartValue | null, sections: Section[]): ChartData | null {
  const table = findChartTable(sections, v?.sourceFieldId ?? null);
  if (!v || chartProblem(v, table, 'en')) return null;
  const columns = v.valueColumns.filter(key => table!.columns.some(c => c.key === key));
  if (!columns.length) return null;
  const labels = table!.rows.map(r => String(r[v.categoryColumn!] ?? ''));
  return {
    labels,
    datasets: columns.map((key, idx) => ({
      label: table!.columns.find(c => c.key === key)?.label ?? key,
      data: table!.rows.map(r => Number(r[key]) || 0),
      backgroundColor: v.chartType === 'pie' ? labels.map((_, i) => color(i)) : color(idx),
      borderColor: v.chartType === 'line' ? color(idx) : undefined
    }))
  };
}

export function chartOptions(v: ChartValue) {
  return {
    plugins: {
      legend: { display: v.showLegend },
      title: { display: !!v.title, text: v.title }
    }
  };
}
