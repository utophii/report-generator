import { ChartValue, Field, ImageValue, Section, TableValue } from './types';
import { buildChartData } from './chartData';

export function fieldHasContent(f: Field, sections: Section[]): boolean {
  const v = f.value;
  switch (f.type) {
    case 'list': return Array.isArray(v) && v.some(s => s.trim());
    case 'table': return ((v as TableValue | null)?.rows?.length ?? 0) > 0;
    case 'image': return !!(v as ImageValue | null)?.path;
    case 'chart': return buildChartData(v as ChartValue | null, sections) !== null;
    default: return v !== null && v !== undefined && String(v).trim() !== '';
  }
}

export function sectionHasContent(s: Section, sections: Section[]): boolean {
  return s.fields.some(f => fieldHasContent(f, sections));
}
