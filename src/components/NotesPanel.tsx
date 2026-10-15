import React, { useState } from 'react';
import { structureDraft, Block, TAG_LABELS } from '@shared/textStructuring';
import { Language } from '@shared/types';
import { useAiRequest, AiRequestUi, parseListResult } from './AiAssist';
import { useAppStore } from '../store/store';

interface Props {
  targetType: 'text' | 'list';
  currentValue: string | string[];
  lang: Language;
  contentLang: Language;
  onApplyText?: (text: string) => void;
  onApplyList?: (items: string[]) => void;
}

export default function NotesPanel({ targetType, lang, contentLang, onApplyText, onApplyList }: Props) {
  const { settings } = useAppStore();
  const ru = lang === 'ru';
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const ai = useAiRequest();

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

  function applyAiResult(text: string) {
    if (targetType === 'list') onApplyList?.(parseListResult(text));
    else onApplyText?.(text);
    reset();
  }

  function reset() { setOpen(false); setDraft(''); setBlocks(null); ai.reset(); }

  if (!open) return <button className="link-btn" onClick={() => setOpen(true)}>{ru ? 'Заметки / черновик…' : 'Notes / draft…'}</button>;

  return (
    <div className="notes-panel">
      <textarea rows={5} placeholder={ru ? 'Вставьте черновик, заметки встречи или список фактов…' : 'Paste a draft, meeting notes, or a list of facts…'} value={draft} onChange={e => setDraft(e.target.value)} />
      <div className="notes-actions">
        <button onClick={insertAsIs} disabled={!draft.trim()}>{ru ? 'Вставить как есть' : 'Insert as is'}</button>
        <button onClick={runStructure} disabled={!draft.trim()}>{ru ? 'Структурировать по правилам' : 'Structure by rules'}</button>
        <button onClick={() => ai.request({ action: 'structure', text: draft, targetLanguage: contentLang })} disabled={!draft.trim() || !settings.aiEnabled || ai.busy}>{ru ? 'Обработать ИИ' : 'Process with AI'}</button>
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

      <AiRequestUi ai={ai} lang={lang} onApply={applyAiResult} />
    </div>
  );
}