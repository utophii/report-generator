import React, { useContext, useEffect, useState } from 'react';
import { RouteContext } from '../App';
import { api } from '../api/bridge';
import { Report, Template } from '@shared/types';
import { buildEmptyTemplate, buildStandardTemplate } from '@shared/defaultTemplates';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';

export default function HomePage() {
  const { navigate } = useContext(RouteContext);
  const { settings, updateSettings } = useAppStore();
  const lang = settings.uiLanguage;
  const [reports, setReports] = useState<Report[]>([]);
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => { api.reports.list().then(setReports); }, []);

  async function openPicker() {
    setTemplates(await api.templates.list());
    setPickerOpen(true);
  }

  async function createReport(template: Template | null) {
    const report = await api.reports.createFromTemplate({ template, title: lang === 'ru' ? 'Новый отчёт' : 'New report', language: lang });
    setPickerOpen(false);
    navigate({ name: 'reportEditor', id: report.id });
  }

  const filtered = reports.filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page">
      <header className="topbar">
        <h1>Report Generator</h1>
        <div className="spacer" />
        <select value={lang} onChange={e => updateSettings({ uiLanguage: e.target.value as any })}>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
        <button onClick={() => navigate({ name: 'templates' })}>{t('templates', lang)}</button>
        <button onClick={() => navigate({ name: 'settings' })}>{t('settings', lang)}</button>
        <button onClick={() => api.app.openDataFolder()}>{t('openDataFolder', lang)}</button>
      </header>

      <div className="toolbar">
        <button className="primary" onClick={openPicker}>+ {t('newReport', lang)}</button>
        <input placeholder={t('search', lang)} value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <h3>{t('recent', lang)}</h3>
      <div className="report-list">
        {filtered.map(r => (
          <div key={r.id} className="report-card" onClick={() => navigate({ name: 'reportEditor', id: r.id })}>
            <div className="report-title">{r.title || '(без названия)'}</div>
            <div className="report-meta">{r.period} · {new Date(r.updatedAt).toLocaleString()}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">Пока нет отчётов</div>}
      </div>

      {pickerOpen && (
        <div className="modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{t('newReport', lang)}</h3>
            <div className="template-grid">
              <div className="template-card" onClick={() => createReport(buildEmptyTemplate(lang))}>{t('blankTemplate', lang)}</div>
              <div className="template-card" onClick={() => createReport(buildStandardTemplate(lang))}>
                {lang === 'ru' ? 'Стандартный отчёт' : 'Standard report'}
              </div>
              {templates.map(tpl => (
                <div key={tpl.id} className="template-card" onClick={() => createReport(tpl)}>{tpl.name}</div>
              ))}
            </div>
            <button onClick={() => setPickerOpen(false)}>{t('cancel', lang)}</button>
          </div>
        </div>
      )}
    </div>
  );
}