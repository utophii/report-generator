import { ChartValue, Field, ImageValue, Report, Section, TableValue } from './types';
import { defaultValueFor } from './defaultTemplates';

export function fieldHasContent(f: Field): boolean {
  const v = f.value;
  switch (f.type) {
    case 'list': return Array.isArray(v) && v.some(s => s.trim());
    case 'table': return ((v as TableValue | null)?.rows?.length ?? 0) > 0;
    case 'image': return !!(v as ImageValue | null)?.path;
    case 'chart': return !!(v as ChartValue | null)?.imagePath;
    default: return v !== null && v !== undefined && String(v).trim() !== '';
  }
}

function clearedValue(f: Field): Field['value'] {
  switch (f.type) {
    case 'table': {
      const t = f.value as TableValue | null;
      return { columns: t?.columns ?? [], rows: [] };
    }
    case 'chart': {
      const c = f.value as ChartValue | null;
      return c ? { ...c, imagePath: null } : defaultValueFor('chart');
    }
    default:
      return defaultValueFor(f.type);
  }
}

export function cloneSectionsWithNewIds(sections: Section[], genId: () => string): { sections: Section[]; fieldIdMap: Map<string, string> } {
  const fieldIdMap = new Map<string, string>();
  const copy: Section[] = JSON.parse(JSON.stringify(sections));
  for (const s of copy) {
    s.id = genId();
    for (const f of s.fields) {
      const id = genId();
      fieldIdMap.set(f.id, id);
      f.id = id;
    }
  }
  for (const s of copy) {
    for (const f of s.fields) {
      const c = f.type === 'chart' ? (f.value as ChartValue | null) : null;
      if (c?.sourceFieldId) c.sourceFieldId = fieldIdMap.get(c.sourceFieldId) ?? null;
    }
  }
  return { sections: copy, fieldIdMap };
}

export function buildReportFromPrevious(
  src: Report,
  opts: { title: string; period: string; keepFieldIds: string[] },
  genId: () => string,
  now = new Date().toISOString()
): Report {
  const keep = new Set(opts.keepFieldIds);
  const { sections, fieldIdMap } = cloneSectionsWithNewIds(src.sections, genId);
  const keptNewIds = new Set([...keep].map(id => fieldIdMap.get(id)).filter((id): id is string => !!id));

  for (const s of sections) {
    for (const f of s.fields) {
      f.carryOver = keptNewIds.has(f.id);
      if (!f.carryOver) f.value = clearedValue(f);
    }
  }
  const allFields = sections.flatMap(s => s.fields);
  for (const f of allFields) {
    const c = f.type === 'chart' ? (f.value as ChartValue | null) : null;
    if (c?.imagePath && c.sourceFieldId && !keptNewIds.has(c.sourceFieldId)) c.imagePath = null;
  }

  return {
    ...src,
    id: genId(),
    title: opts.title,
    period: opts.period,
    status: 'draft',
    sections,
    createdAt: now,
    updatedAt: now
  };
}

export function titleForPeriod(title: string, oldPeriod: string, newPeriod: string): string {
  if (!oldPeriod.trim() || !title.includes(oldPeriod)) return title;
  return title.split(oldPeriod).join(newPeriod);
}
