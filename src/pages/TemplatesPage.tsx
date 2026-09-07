import React, { useContext, useEffect, useState } from 'react';
import { RouteContext } from '../App';
import { api } from '../api/bridge';
import { Template } from '@shared/types';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';
import { v4 as uuid } from 'uuid';

export default function TemplatesPage() {
  const { navigate } = useContext(RouteContext);
  const { settings } = useAppStore();
  const lang = settings.uiLanguage;
  const [templates, setTemplates] = useState<Template[]>([]);

  const refresh = () => api.templates.list().then(setTemplates);
  useEffect(() => { refresh(); }, []);

  async function duplicate(tpl: Template) {
    const now = new Date().toISOString();
    const copy: Template = { ...JSON.parse(JSON.stringify(tpl)), id: uuid(), name: tpl.name + ' (копия)', createdAt: now, updatedAt: now };
    await api.templates.save(copy);
    refresh();
  }
  async function remove(id: string) {
    if (!confirm(t('confirmDeleteTemplate', lang))) return;
    await api.templates.delete(id);
    refresh();
  }

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => navigate({ name: 'home' })}>←</button>
        <h1>{t('templates', lang)}</h1>
        <div className="spacer" />
        <button className="primary" onClick={() => navigate({ name: 'templateEditor', id: null })}>+ {lang === 'ru' ? 'Новый шаблон' : 'New template'}</button>
      </header>
      <div className="report-list">
        {templates.map(tpl => (
          <div key={tpl.id} className="report-card">
            <div className="report-title" onClick={() => navigate({ name: 'templateEditor', id: tpl.id })}>{tpl.name}</div>
            <div className="report-meta">{tpl.language.toUpperCase()} · {tpl.sections.length} {lang === 'ru' ? 'разделов' : 'sections'}</div>
            <div className="row-actions">
              <button onClick={() => duplicate(tpl)}>{t('duplicate', lang)}</button>
              <button onClick={() => remove(tpl.id)}>{t('delete', lang)}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}