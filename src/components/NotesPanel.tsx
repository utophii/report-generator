import React, { useState } from 'react';
import { structureDraft, Block, TAG_LABELS } from '@shared/textStructuring';
import { Language } from '@shared/types';
import { api } from '../api/bridge';
import { useAppStore } from '../store/store';

interface Props {
  targetType: 'text' | 'list';
  currentValue: string | string[];
  lang: Language;
  onApplyText?: (text: string) => void;
  onApplyList?: (items: string[]) => void;
}

export default function NotesPanel({ targetType, lang, onApplyText, onApplyList }: Props) {
  const { settings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [aiConfirm, setAiConfirm] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function insertAsIs() {
    if (targetType === 'text') onApplyText?.(draft);
    else onApplyList?.(draft.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
    reset();
  }

  function runStructure() {
    setBlocks(structureDraft(draft, lang));
  }

  function applyStructured() {
    if (!blocks) return;
    if (targetType === 'list') {
      const items = blocks.filter(b => b.kind !== 'heading').map(b => (b as any).text);
      onApplyList?.(items);
    } else {
      const text = blocks.map(b => {
        if (b.kind === 'heading') return `\n## ${b.text}\n`;
        if (b.kind === 'tagged') return `${TAG_LABELS[b.tag]?.[lang] ?? b.tag}: ${b.text}`;
        return b.text;
      }).join('\n');
      onApplyText?.(text);
    }
    reset();
  }

  async function runAi() {
    setBusy(true); setAiError(null);
    const res = await api.ai.process({ action: 'structure', text: draft, targetLanguage: lang });
    setBusy(false);
    if (!res.ok) { setAiError(res.error); return; }
    setAiResult(res.text);
  }

  function applyAiResult() {
    if (!aiResult) return;
    if (targetType === 'list') onApplyList?.(aiResult.split(/\r?\n/).map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean));
    else onApplyText?.(aiResult);
    reset();
  }

  function reset() { setOpen(false); setDraft(''); setBlocks(null); setAiResult(null); setAiConfirm(false); }

  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}>Заметки / черновик…</button>;

  return (
    <div className="notes-panel">
      <textarea rows={5} placeholder="Вставьте черновик, заметки встречи или список фактов…" value={draft} onChange={e => setDraft(e.target.value)} />
      <div className="notes-actions">
        <button onClick={insertAsIs} disabled={!draft.trim()}>Вставить как есть</button>
        <button onClick={runStructure} disabled={!draft.trim()}>Структурировать по правилам</button>
        <button onClick={() => setAiConfirm(true)} disabled={!draft.trim() || !settings.aiEnabled}>Обработать ИИ</button>
        <button onClick={reset}>Отмена</button>
      </div>
      {!settings.aiEnabled && <div className="hint">ИИ отключён (Настройки → ИИ)</div>}

      {blocks && (
        <div className="structured-preview">
          <h4>Предложенная структура</h4>
          <ul>
            {blocks.map((b, i) => (
              <li key={i}>{b.kind === 'tagged' ? `[${TAG_LABELS[b.tag]?.[lang] ?? b.tag}] ` : ''}{(b as any).text}</li>
            ))}
          </ul>
          <button className="primary" onClick={applyStructured}>Применить</button>
        </div>
      )}

      {aiConfirm && (
        <div className="modal-overlay" onClick={() => setAiConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Подтверждение отправки в ИИ</h3>
            <p>Выбранный текст будет передан подключённому провайдеру ИИ. Продолжить?</p>
            <div className="modal-actions">
              <button onClick={() => setAiConfirm(false)}>Отмена</button>
              <button className="primary" onClick={() => { setAiConfirm(false); runAi(); }}>Отправить</button>
            </div>
          </div>
        </div>
      )}

      {busy && <div className="hint">Обработка…</div>}
      {aiError && <div className="error-banner">{aiError}</div>}
      {aiResult && (
        <div className="structured-preview">
          <h4>Предложение ИИ</h4>
          <textarea rows={6} value={aiResult} onChange={e => setAiResult(e.target.value)} />
          <div className="modal-actions">
            <button onClick={() => setAiResult(null)}>Отклонить</button>
            <button className="primary" onClick={applyAiResult}>Применить</button>
          </div>
        </div>
      )}
    </div>
  );
}