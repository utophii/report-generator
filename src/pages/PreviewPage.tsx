import React, { useContext, useEffect, useState } from 'react';
import { RouteContext } from '../App';
import { api } from '../api/bridge';
import { Report, ThemeId } from '@shared/types';
import { THEMES } from '@shared/themes';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';
import ReportView from '../components/ReportView';

export default function PreviewPage({ id }: { id: string }) {
  const { navigate } = useContext(RouteContext);
  const { settings } = useAppStore();
  const lang = settings.uiLanguage;
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { api.reports.get(id).then(setReport); }, [id]);
  if (!report) return <div className="loading">…</div>;

  async function setTheme(theme: ThemeId) {
    const updated = { ...report!, theme };
    setReport(updated);
    await api.reports.save(updated);
  }

  async function doExport(format: 'pdf' | 'docx' | 'xlsx') {
    setBusy(format); setMessage(null);
    const res = await api.exportReport.run(report!, format);
    setBusy(null);
    if (res.cancelled) return;
    if (!res.ok) { setMessage(`Ошибка экспорта: ${res.error}`); return; }
    setMessage(`Сохранено: ${res.filePath}`);
  }

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => navigate({ name: 'reportEditor', id: report.id })}>{t('backToEdit', lang)}</button>
        <button onClick={() => navigate({ name: 'home' })}>Главная</button>
        <div className="spacer" />
        <span>{t('theme', lang)}:</span>
        {(Object.keys(THEMES) as ThemeId[]).map(id => (
          <button key={id} className={report.theme === id ? 'active' : ''} onClick={() => setTheme(id)}>{THEMES[id].name[lang]}</button>
        ))}
        <button disabled={!!busy} onClick={() => doExport('pdf')}>{busy === 'pdf' ? '…' : 'PDF'}</button>
        <button disabled={!!busy} onClick={() => doExport('docx')}>{busy === 'docx' ? '…' : 'DOCX'}</button>
        <button disabled={!!busy} onClick={() => doExport('xlsx')}>{busy === 'xlsx' ? '…' : 'XLSX'}</button>
      </header>
      {message && <div className="hint">{message}</div>}
      <div className="preview-wrapper">
        <ReportView report={report} />
      </div>
    </div>
  );
}