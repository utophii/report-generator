import React from 'react';
import { Field, Language, Section, TableValue, ImageValue, ChartValue } from '@shared/types';
import TableEditor from './TableEditor';
import ChartEditor from './ChartEditor';
import NotesPanel from './NotesPanel';
import { AiFieldActions, parseListResult } from './AiAssist';
import { reportToText } from '@shared/reportText';
import { useAppStore } from '../store/store';
import { api } from '../api/bridge';

interface Props {
  field: Field;
  onChange: (p: Partial<Field>) => void;
  lang: Language;
  contentLang: Language;
  allTableFields: { id: string; label: string }[];
  reportSections: Section[];
}

export default function FieldValueEditor({ field, onChange, lang, contentLang, allTableFields, reportSections }: Props) {
  const { settings } = useAppStore();
  const ru = lang === 'ru';
  const reportText = () => reportToText(reportSections, { excludeFieldId: field.id });
  const reportHasContent = reportText().length > 0;
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
          <AiFieldActions lang={lang} enabled={settings.aiEnabled} onApply={txt => onChange({ value: txt })} actions={[
            { key: 'improve', label: ru ? 'Улучшить' : 'Improve', disabled: !(field.value as string)?.trim(),
              build: () => ({ action: 'improve', text: field.value as string, targetLanguage: contentLang }) },
            { key: 'translate', label: `${ru ? 'Перевести на' : 'Translate to'} ${contentLang.toUpperCase()}`, disabled: !(field.value as string)?.trim(),
              build: () => ({ action: 'translate', text: field.value as string, targetLanguage: contentLang }) },
            { key: 'summarize', label: ru ? 'Резюме по отчёту' : 'Summary of report', disabled: !reportHasContent,
              build: () => ({ action: 'summarize', text: reportText(), targetLanguage: contentLang }) }
          ]} />
          <NotesPanel targetType="text" currentValue={(field.value as string) ?? ''} lang={lang} contentLang={contentLang}
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
          <button onClick={() => onChange({ value: [...items, ''] })}>+ {lang === 'ru' ? 'пункт' : 'item'}</button>
          <AiFieldActions lang={lang} enabled={settings.aiEnabled} onApply={txt => onChange({ value: [...items, ...parseListResult(txt)] })} actions={[
            { key: 'suggest', label: ru ? 'Предложить пункты по отчёту' : 'Suggest items from report', disabled: !reportHasContent,
              build: () => ({ action: 'suggest', text: reportText(), targetLanguage: contentLang, fieldLabel: field.label }) }
          ]} />
          <NotesPanel targetType="list" currentValue={items} lang={lang} contentLang={contentLang}
            onApplyList={list => onChange({ value: [...items, ...list] })} />
        </div>
      );
    }
    case 'table':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <TableEditor value={field.value as TableValue} onChange={v => onChange({ value: v })} lang={lang} />
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
          }}>{img ? (lang === 'ru' ? 'Заменить изображение' : 'Replace image') : (lang === 'ru' ? 'Выбрать изображение' : 'Choose image')}</button>
          {img?.path && (
            <input placeholder={lang === 'ru' ? 'Подпись' : 'Caption'} value={img.caption ?? ''} onChange={e => onChange({ value: { ...img, caption: e.target.value } })} />
          )}
        </div>
      );
    }
    case 'chart':
      return (
        <div className="field-value">
          <label>{field.label}</label>
          <ChartEditor value={field.value as ChartValue} onChange={v => onChange({ value: v })} reportSections={reportSections} lang={lang} />
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