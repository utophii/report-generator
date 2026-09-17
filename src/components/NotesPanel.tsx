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
  const ru = lang === 'ru';
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

  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}>{ru ? 'Заметки / черновик…' : 'Notes / draft…'}</button>;

  return (
    <div className="notes-panel">
      <textarea rows={5} placeholder={ru ? 'Вставьте черновик, заметки встречи или список фактов…' : 'Paste a draft, meeting notes, or a list of facts…'} value={draft} onChange={e => setDraft(e.target.value)} />
      <div className="notes-actions">
        <button onClick={insertAsIs} disabled={!draft.trim()}>{ru ? 'Вставить как есть' : 'Insert as is'}</button>
        <button onClick={runStructure} disabled={!draft.trim()}>{ru ? 'Структурировать по правилам' : 'Structure by rules'}</button>
        <button onClick={() => setAiConfirm(true)} disabled={!draft.trim() || !settings.aiEnabled}>{ru ? 'Обработать ИИ' : 'Process with AI'}</button>
        <button onClick={reset}>{ru ? 'Отмена' : 'Cancel'}</button>
      </div>
      {!settings.aiEnabled && <div className="hint">{ru ? 'ИИ отключён (Настройки → ИИ)' : 'AI is disabled (Settings → AI)'}</div>}

      {blocks && (
        <div className="structured-preview">
          <h4>{ru ? 'Предложенная структура' : 'Suggested structure'}</h4>
          <ul>
            {blocks.map((b, i) => (
              <li key={i}>{b.kind === 'tagged' ? `[${TAG_LABELS[b.tag]?.[lang] ?? b.tag}] ` : ''}{(b as any).text}</li>
            ))}
          </ul>
          <button className="primary" onClick={applyStructured}>{ru ? 'Применить' : 'Apply'}</button>
        </div>
      )}

      {aiConfirm && (
        <div className="modal-overlay" onClick={() => setAiConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{ru ? 'Подтверждение отправки в ИИ' : 'Confirm sending to AI'}</h3>
            <p>{ru ? 'Выбранный текст будет передан подключённому провайдеру ИИ. Продолжить?' : 'The text will be sent to the connected AI provider. Continue?'}</p>
            <div className="modal-actions">
              <button onClick={() => setAiConfirm(false)}>{ru ? 'Отмена' : 'Cancel'}</button>
              <button className="primary" onClick={() => { setAiConfirm(false); runAi(); }}>{ru ? 'Отправить' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}

      {busy && <div className="hint">{ru ? 'Обработка…' : 'Processing…'}</div>}
      {aiError && <div className="error-banner">{aiError}</div>}
      {aiResult && (
        <div className="structured-preview">
          <h4>{ru ? 'Предложение ИИ' : 'AI suggestion'}</h4>
          <textarea rows={6} value={aiResult} onChange={e => setAiResult(e.target.value)} />
          <div className="modal-actions">
            <button onClick={() => setAiResult(null)}>{ru ? 'Отклонить' : 'Reject'}</button>
            <button className="primary" onClick={applyAiResult}>{ru ? 'Применить' : 'Apply'}</button>
          </div>
        </div>
      )}
    </div>
  );
}