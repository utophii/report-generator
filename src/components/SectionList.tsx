import React from 'react';
import { v4 as uuid } from 'uuid';
import { Field, FieldType, Section, Language } from '@shared/types';
import FieldDefinitionEditor from './FieldDefinitionEditor';
import FieldValueEditor from './FieldValueEditor';
import { t } from '../i18n/i18n';

interface Props {
  mode: 'template' | 'report';
  sections: Section[];
  onChange: (s: Section[]) => void;
  lang: Language;
  reportSections?: Section[]; // для chart-полей нужен доступ ко всем таблицам отчёта
}

function newSection(order: number): Section {
  return { id: uuid(), title: 'Новый раздел', level: 1, required: false, order, showInToc: true, fields: [] };
}
function newField(order: number, type: FieldType): Field {
  const base: Field = { id: uuid(), label: 'Новое поле', type, required: false, order, value: null };
  if (type === 'list') base.value = [];
  if (type === 'table') base.value = { columns: [], rows: [] };
  if (type === 'chart') base.value = { sourceFieldId: null, chartType: 'bar', title: '', categoryColumn: null, valueColumns: [], showLegend: true };
  if (type === 'select') { base.options = ['Вариант 1', 'Вариант 2']; base.value = ''; }
  return base;
}

export default function SectionList({ mode, sections, onChange, lang, reportSections }: Props) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function updateSection(id: string, patch: Partial<Section>) {
    onChange(sections.map(s => s.id === id ? { ...s, ...patch } : s));
  }
  function addSection() {
    onChange([...sections, newSection(sections.length)]);
  }
  function removeSection(id: string) {
    onChange(sections.filter(s => s.id !== id));
  }
  function duplicateSection(s: Section) {
    const copy: Section = { ...JSON.parse(JSON.stringify(s)), id: uuid(), order: sections.length, fields: s.fields.map(f => ({ ...f, id: uuid() })) };
    onChange([...sections, copy]);
  }
  function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    onChange(sections.map(s => s.id === a.id ? { ...s, order: b.order } : s.id === b.id ? { ...s, order: a.order } : s));
  }

  function addField(sectionId: string, type: FieldType) {
    const s = sections.find(x => x.id === sectionId)!;
    updateSection(sectionId, { fields: [...s.fields, newField(s.fields.length, type)] });
  }
  function updateField(sectionId: string, fieldId: string, patch: Partial<Field>) {
    const s = sections.find(x => x.id === sectionId)!;
    updateSection(sectionId, { fields: s.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f) });
  }
  function removeField(sectionId: string, fieldId: string) {
    const s = sections.find(x => x.id === sectionId)!;
    updateSection(sectionId, { fields: s.fields.filter(f => f.id !== fieldId) });
  }
  function moveField(sectionId: string, fieldId: string, dir: -1 | 1) {
    const s = sections.find(x => x.id === sectionId)!;
    const arr = [...s.fields].sort((a, b) => a.order - b.order);
    const idx = arr.findIndex(f => f.id === fieldId);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    const a = arr[idx], b = arr[swapIdx];
    updateSection(sectionId, { fields: s.fields.map(f => f.id === a.id ? { ...f, order: b.order } : f.id === b.id ? { ...f, order: a.order } : f) });
  }

  const allTableFieldsFlat = (reportSections ?? sections).flatMap(s => s.fields.filter(f => f.type === 'table').map(f => ({ id: f.id, label: `${s.title} / ${f.label}` })));

  return (
    <div className="section-list">
      {sorted.map((s, i) => (
        <div key={s.id} className="section-card">
          <div className="section-header">
            <button title="Вверх" onClick={() => move(s.id, -1)} disabled={i === 0}>▲</button>
            <button title="Вниз" onClick={() => move(s.id, 1)} disabled={i === sorted.length - 1}>▼</button>
            <input className="section-title-input" value={s.title} onChange={e => updateSection(s.id, { title: e.target.value })} />
            <select value={s.level} onChange={e => updateSection(s.id, { level: Number(e.target.value) as any })}>
              <option value={1}>H1</option><option value={2}>H2</option><option value={3}>H3</option>
            </select>
            <label><input type="checkbox" checked={s.required} onChange={e => updateSection(s.id, { required: e.target.checked })} /> {t('required', lang)}</label>
            <label><input type="checkbox" checked={s.showInToc} onChange={e => updateSection(s.id, { showInToc: e.target.checked })} /> TOC</label>
            <button onClick={() => updateSection(s.id, { collapsed: !s.collapsed })}>{s.collapsed ? '▸' : '▾'}</button>
            <button onClick={() => duplicateSection(s)}>{t('duplicate', lang)}</button>
            <button onClick={() => removeSection(s.id)}>{t('delete', lang)}</button>
          </div>
          <input className="section-hint-input" placeholder="Подсказка / описание раздела" value={s.hint ?? ''}
            onChange={e => updateSection(s.id, { hint: e.target.value })} />

          {!s.collapsed && (
            <div className="field-list">
              {[...s.fields].sort((a, b) => a.order - b.order).map((f, fi, arr) => (
                <div key={f.id} className="field-row">
                  <div className="field-controls">
                    <button onClick={() => moveField(s.id, f.id, -1)} disabled={fi === 0}>▲</button>
                    <button onClick={() => moveField(s.id, f.id, 1)} disabled={fi === arr.length - 1}>▼</button>
                    <button onClick={() => removeField(s.id, f.id)}>✕</button>
                  </div>
                  {mode === 'template'
                    ? <FieldDefinitionEditor field={f} onChange={patch => updateField(s.id, f.id, patch)} lang={lang} />
                    : <FieldValueEditor field={f} onChange={patch => updateField(s.id, f.id, patch)} lang={lang} allTableFields={allTableFieldsFlat} reportSections={reportSections ?? sections} />}
                </div>
              ))}
              <div className="add-field-row">
                {(['text', 'textarea', 'richtext', 'number', 'date', 'select', 'list', 'table', 'image', 'chart'] as FieldType[]).map(type => (
                  <button key={type} onClick={() => addField(s.id, type)}>+ {type}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <button className="primary" onClick={addSection}>+ {t('addSection', lang)}</button>
    </div>
  );
}