import React from 'react';
import { Field, Language } from '@shared/types';
import { t } from '../i18n/i18n';

export default function FieldDefinitionEditor({ field, onChange, lang }: { field: Field; onChange: (p: Partial<Field>) => void; lang: Language }) {
  return (
    <div className="field-def">
      <input value={field.label} onChange={e => onChange({ label: e.target.value })} placeholder="Название поля" />
      <span className="field-type-badge">{field.type}</span>
      <label><input type="checkbox" checked={field.required} onChange={e => onChange({ required: e.target.checked })} /> {t('required', lang)}</label>
      {field.type === 'select' && (
        <input
          placeholder="Варианты через запятую"
          value={(field.options ?? []).join(', ')}
          onChange={e => onChange({ options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
      )}
      <input placeholder="Подсказка (необязательно)" value={field.hint ?? ''} onChange={e => onChange({ hint: e.target.value })} />
    </div>
  );
}