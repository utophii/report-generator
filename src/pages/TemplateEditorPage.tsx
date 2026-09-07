import React, { useContext, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { RouteContext } from '../App';
import { api } from '../api/bridge';
import { Template } from '@shared/types';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';
import SectionList from '../components/SectionList';

export default function TemplateEditorPage({ id }: { id: string | null }) {
  const { navigate } = useContext(RouteContext);
  const { settings } = useAppStore();
  const lang = settings.uiLanguage;
  const [tpl, setTpl] = useState<Template | null>(null);

  useEffect(() => {
    if (id) api.templates.get(id).then(setTpl);
    else {
      const now = new Date().toISOString();
      setTpl({ id: uuid(), name: 'Новый шаблон', description: '', language: 'ru', theme: 'modern', sections: [], createdAt: now, updatedAt: now });
    }
  }, [id]);

  if (!tpl) return <div className="loading">…</div>;

  async function save() {
    const updated = { ...tpl!, updatedAt: new Date().toISOString() };
    await api.templates.save(updated);
    navigate({ name: 'templates' });
  }

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => navigate({ name: 'templates' })}>←</button>
        <input className="title-input" value={tpl.name} onChange={e => setTpl({ ...tpl, name: e.target.value })} />
        <div className="spacer" />
        <select value={tpl.language} onChange={e => setTpl({ ...tpl, language: e.target.value as any })}>
          <option value="ru">Русский</option><option value="en">English</option>
        </select>
        <select value={tpl.theme} onChange={e => setTpl({ ...tpl, theme: e.target.value as any })}>
          <option value="strict">Строгая</option><option value="modern">Современная</option><option value="minimal">Минималистичная</option>
        </select>
        <button className="primary" onClick={save}>{t('save', lang)}</button>
      </header>

      <textarea className="description" placeholder="Описание шаблона" value={tpl.description}
        onChange={e => setTpl({ ...tpl, description: e.target.value })} />

      <SectionList
        mode="template"
        sections={tpl.sections}
        onChange={sections => setTpl({ ...tpl, sections })}
        lang={lang}
      />
    </div>
  );
}