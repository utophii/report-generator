import React, { useState } from 'react';
import { AiActionRequest, Language } from '@shared/types';
import { api } from '../api/bridge';

export function parseListResult(text: string): string[] {
  return text.split(/\r?\n/).map(l => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
}

export function useAiRequest() {
  const [pending, setPending] = useState<AiActionRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function confirm() {
    if (!pending) return;
    const req = pending;
    setPending(null); setBusy(true); setError(null); setResult(null);
    const res = await api.ai.process(req);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setResult(res.text);
  }

  function reset() { setPending(null); setBusy(false); setError(null); setResult(null); }

  return { pending, busy, error, result, setResult, request: setPending, cancel: () => setPending(null), confirm, reset };
}

type AiRequestState = ReturnType<typeof useAiRequest>;

export function AiRequestUi({ ai, lang, onApply }: { ai: AiRequestState; lang: Language; onApply: (text: string) => void }) {
  const ru = lang === 'ru';
  return (
    <>
      {ai.pending && (
        <div className="modal-overlay" onClick={ai.cancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{ru ? 'Подтверждение отправки в ИИ' : 'Confirm sending to AI'}</h3>
            <p>{ru ? 'Текст будет передан подключённому провайдеру ИИ. Продолжить?' : 'The text will be sent to the connected AI provider. Continue?'}</p>
            <div className="modal-actions">
              <button onClick={ai.cancel}>{ru ? 'Отмена' : 'Cancel'}</button>
              <button className="primary" onClick={ai.confirm}>{ru ? 'Отправить' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}

      {ai.busy && <div className="hint">{ru ? 'Обработка…' : 'Processing…'}</div>}
      {ai.error && <div className="error-banner">{ai.error}</div>}
      {ai.result !== null && (
        <div className="structured-preview">
          <h4>{ru ? 'Предложение ИИ' : 'AI suggestion'}</h4>
          <textarea rows={6} value={ai.result} onChange={e => ai.setResult(e.target.value)} />
          <div className="modal-actions">
            <button onClick={ai.reset}>{ru ? 'Отклонить' : 'Reject'}</button>
            <button className="primary" onClick={() => { onApply(ai.result!); ai.reset(); }}>{ru ? 'Применить' : 'Apply'}</button>
          </div>
        </div>
      )}
    </>
  );
}

export interface AiFieldAction {
  key: string;
  label: string;
  disabled?: boolean;
  build: () => AiActionRequest;
}

export function AiFieldActions({ actions, lang, enabled, onApply }: {
  actions: AiFieldAction[];
  lang: Language;
  enabled: boolean;
  onApply: (text: string) => void;
}) {
  const ai = useAiRequest();
  if (!enabled) return null;
  return (
    <div className="ai-field-actions">
      <div className="notes-actions">
        {actions.map(a => (
          <button key={a.key} className="ai-btn" disabled={a.disabled || ai.busy} onClick={() => ai.request(a.build())}>✨ {a.label}</button>
        ))}
      </div>
      <AiRequestUi ai={ai} lang={lang} onApply={onApply} />
    </div>
  );
}
