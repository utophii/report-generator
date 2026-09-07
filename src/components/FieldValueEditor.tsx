import React from 'react';
import { Field, Language, TableValue, ImageValue, ChartValue } from '@shared/types';
import TableEditor from './TableEditor';
import ChartEditor from './ChartEditor';
import NotesPanel from './NotesPanel';
import { api } from '../api/bridge';

interface Props {
  field: Field;
  onChange: (p: Partial<Field>) => void;
  lang: Language;
  allTableFields: { id: string; label: string }[];
  reportSections: Section[];
}

export default function FieldValueEditor({ field, onChange, lang, allTableFields, reportSections }: Props) {
  switch (field.type) {
    case 'text':
      return <div className="field-value"><label>{field.label}</label><input value={(field.value as string) ?? ''} onChange={e => onChange({ value: e.target.value })} /></div>;
    case 'number':
      return <div className="field-value"><label>{field.label}</label><input type="number" value={field.value === null ? '' : Number(field.value)} onChange={e => onChange({ value: e.target.value === '' ? null : Number(e.target.value) })} /></div>;
    case 'date':
      return <div className="field-value"><label>{field.label}</label><input type="date" value={(field.value as string) ?? ''} onChange={e => onChange({ value: e.target.value })} /></div>;
    case 'select':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <select value={(field.value as string) ?? ''} onChange={e => onChange({ value: e.target.value })}>
            <option value="">—</option>
            {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case 'textarea':
    case 'richtext':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <textarea rows={5} value={(field.value as string) ?? ''} onChange={e => onChange({ value: e.target.value })} />
          <NotesPanel targetType="text" currentValue={(field.value as string) ?? ''} lang={lang}
            onApplyText={txt => onChange({ value: txt })} />
        </div>
      );
    case 'list': {
      const items = (field.value as string[]) ?? [];
      return (
        <div className="field-value">
          <label>{field.label}</label>
          {items.map((it, idx) => (
            <div key={idx} className="list-row">
              <input value={it} onChange={e => { const c = [...items]; c[idx] = e.target.value; onChange({ value: c }); }} />
              <button onClick={() => onChange({ value: items.filter((_, i) => i !== idx) })}>✕</button>
            </div>
          ))}
          <button onClick={() => onChange({ value: [...items, ''] })}>+ пункт</button>
          <NotesPanel targetType="list" currentValue={items} lang={lang}
            onApplyList={list => onChange({ value: [...items, ...list] })} />
        </div>
      );
    }
    case 'table':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <TableEditor value={field.value as TableValue} onChange={v => onChange({ value: v })} />
        </div>
      );
    case 'image': {
      const img = field.value as ImageValue | null;
      return (
        <div className="field-value">
          <label>{field.label}</label>
          {img?.path && <ImagePreview path={img.path} />}
          <button onClick={async () => {
            const p = await api.dialogs.pickImage();
            if (p) onChange({ value: { path: p, caption: img?.caption ?? '' } });
          }}>{img ? 'Заменить изображение' : 'Выбрать изображение'}</button>
          {img?.path && (
            <input placeholder="Подпись" value={img.caption ?? ''} onChange={e => onChange({ value: { ...img, caption: e.target.value } })} />
          )}
        </div>
      );
    }
    case 'chart':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <ChartEditor value={field.value as ChartValue} onChange={v => onChange({ value: v })} reportSections={reportSections} />
        </div>
      );
    default:
      return null;
  }
}

function ImagePreview({ path }: { path: string }) {
  const [src, setSrc] = React.useState<string | null>(null);
  React.useEffect(() => { api.images.getDataUrl(path).then(setSrc); }, [path]);
  if (!src) return null;
  return <img src={src} style={{ maxWidth: 240, display: 'block' }} />;
}