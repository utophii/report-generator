import React, { useContext, useEffect, useRef, useState } from 'react';
import { RouteContext } from '../App';
import { api } from '../api/bridge';
import { Report } from '@shared/types';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';
import SectionList from '../components/SectionList';

export default function ReportEditorPage({ id }: { id: string }) {
  const { navigate } = useContext(RouteContext);
  const { settings } = useAppStore();
  const lang = settings.uiLanguage;
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<any>(null);

  useEffect(() => { api.reports.get(id).then(setReport); }, [id]);

  function scheduleSave(next: Report) {
    setReport(next);
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await api.reports.save(next); setStatus('saved'); }
      catch { setStatus('error'); }
    }, 1200);
  }

  if (!report) return <div className="loading">…</div>;

  const statusText = { idle: '', saving: t('saving', lang), saved: t('saved', lang), error: 'Ошибка сохранения' }[status];

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => navigate({ name: 'home' })}>←</button>
        <input className="title-input" value={report.title} onChange={e => scheduleSave({ ...report, title: e.target.value })} />
        <input className="period-input" placeholder={t('period', lang)} value={report.period} onChange={e => scheduleSave({ ...report, period: e.target.value })} />
        <input className="author-input" placeholder={t('author', lang)} value={report.author} onChange={e => scheduleSave({ ...report, author: e.target.value })} />
        <select value={report.language} onChange={e => scheduleSave({ ...report, language: e.target.value as any })}>
          <option value="ru">RU</option><option value="en">EN</option>
        </select>
        <select value={report.theme} onChange={e => scheduleSave({ ...report, theme: e.target.value as any })}>
          <option value="strict">Строгая</option><option value="modern">Современная</option><option value="minimal">Минималистичная</option>
        </select>
        <span className="save-status">{statusText}</span>
        <div className="spacer" />
        <button className="primary" onClick={() => navigate({ name: 'preview', id: report.id })}>{t('preview', lang)}</button>
      </header>

      <SectionList
        mode="report"
        sections={report.sections}
        reportSections={report.sections}
        onChange={sections => scheduleSave({ ...report, sections })}
        lang={lang}
      />
    </div>
  );
}