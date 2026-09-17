import React from 'react';
import { Field, Language } from '@shared/types';
import { t } from '../i18n/i18n';

export default function FieldDefinitionEditor({ field, onChange, lang }: { field: Field; onChange: (p: Partial<Field>) => void; lang: Language }) {
  return (
    <div className="field-def">
      <input value={field.label} onChange={e => onChange({ label: e.target.value })} placeholder={lang === 'ru' ? 'Название поля' : 'Field name'} />
      <span className="field-type-badge">{field.type}</span>
      <label><input type="checkbox" checked={field.required} onChange={e => onChange({ required: e.target.checked })} /> {t('required', lang)}</label>
      {field.type === 'select' && (
        <input
          placeholder={lang === 'ru' ? 'Варианты через запятую' : 'Options separated by commas'}
          value={(field.options ?? []).join(', ')}
          onChange={e => onChange({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
      )}
      <input placeholder={lang === 'ru' ? 'Подсказка (необязательно)' : 'Hint (optional)'} value={field.hint ?? ''} onChange={e => onChange({ hint: e.target.value })} />
    </div>
  );
}