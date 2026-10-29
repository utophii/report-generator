import React, { useEffect, useRef, useState } from 'react';
import { Language, Report, Section } from '@shared/types';
import { nextPeriod } from '@shared/periodShift';
import { fieldHasContent, titleForPeriod } from '@shared/reportCopy';
import { api } from '../api/bridge';
import { t } from '../i18n/i18n';

function SectionCheckbox({ section, keep, onToggle }: { section: Section; keep: Set<string>; onToggle: (ids: string[], on: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const ids = section.fields.map(f => f.id);
  const kept = ids.filter(id => keep.has(id)).length;
  useEffect(() => { if (ref.current) ref.current.indeterminate = kept > 0 && kept < ids.length; }, [kept, ids.length]);
  return (
    <label className="copy-tree-section">
      <input ref={ref} type="checkbox" disabled={ids.length === 0} checked={ids.length > 0 && kept === ids.length}
        onChange={e => onToggle(ids, e.target.checked)} />
      {section.title}
    </label>
  );
}

export default function CopyReportDialog({ report, lang, onClose, onCreated }: {
  report: Report; lang: Language; onClose: () => void; onCreated: (r: Report) => void;
}) {
  const ru = lang === 'ru';
  const guessed = nextPeriod(report.period);
  const [period, setPeriod] = useState(guessed ?? '');
  const [title, setTitle] = useState(titleForPeriod(report.title, report.period, guessed ?? report.period));
  const [titleTouched, setTitleTouched] = useState(false);
  const [keep, setKeep] = useState<Set<string>>(() => new Set(report.sections.flatMap(s => s.fields.filter(f => f.carryOver).map(f => f.id))));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = [...report.sections].sort((a, b) => a.order - b.order);
  const allIds = sections.flatMap(s => s.fields.map(f => f.id));

  function changePeriod(p: string) {
    setPeriod(p);
    if (!titleTouched) setTitle(titleForPeriod(report.title, report.period, p));
  }

  function toggle(ids: string[], on: boolean) {
    setKeep(prev => {
      const next = new Set(prev);
      ids.forEach(id => on ? next.add(id) : next.delete(id));
      return next;
    });
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const created = await api.reports.createFromPrevious({ sourceId: report.id, title, period, keepFieldIds: [...keep] });
      onCreated(created);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal wide" onClick={e => e.stopPropagation()}>
        <h3>{t('createFromPrevious', lang)}</h3>

        <div className="copy-form">
          <label>
            {t('period', lang)}
            <input value={period} onChange={e => changePeriod(e.target.value)}
              placeholder={report.period ? `${ru ? 'Было' : 'Was'}: ${report.period}` : ''} />
          </label>
          {report.period && !guessed && (
            <div className="hint">{ru ? 'Не удалось определить следующий период, введите его вручную.' : "Couldn't detect the next period, please enter it manually."}</div>
          )}
          <label>
            {t('title', lang)}
            <input value={title} onChange={e => { setTitle(e.target.value); setTitleTouched(true); }} />
          </label>
        </div>

        <div className="copy-tree-header">
          <strong>{ru ? 'Перенести содержимое' : 'Carry over content'}</strong>
          <div className="spacer" />
          <button onClick={() => setKeep(new Set(allIds))}>{ru ? 'Всё' : 'All'}</button>
          <button onClick={() => setKeep(new Set())}>{ru ? 'Ничего' : 'None'}</button>
        </div>
        <div className="hint">
          {ru ? 'Структура копируется полностью; у неотмеченных полей очищаются значения (у таблиц остаются столбцы). Выбор запомнится для следующего раза.'
              : 'The structure is always copied; unchecked fields are cleared (tables keep their columns). Your choice is remembered for next time.'}
        </div>

        <div className="copy-tree">
          {sections.map(s => (
            <div key={s.id}>
              <SectionCheckbox section={s} keep={keep} onToggle={toggle} />
              {[...s.fields].sort((a, b) => a.order - b.order).map(f => (
                <label key={f.id} className={`copy-tree-field${fieldHasContent(f) ? '' : ' empty-field'}`}>
                  <input type="checkbox" checked={keep.has(f.id)} onChange={e => toggle([f.id], e.target.checked)} />
                  {f.label || '—'}
                  <span className="field-type-badge">{f.type}</span>
                  {!fieldHasContent(f) && <span className="hint">{ru ? '(пусто)' : '(empty)'}</span>}
                </label>
              ))}
            </div>
          ))}
        </div>

        {error && <div className="error-banner">{error}</div>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={busy}>{t('cancel', lang)}</button>
          <button className="primary" onClick={create} disabled={busy}>{ru ? 'Создать' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
