import { Language } from './types';

export type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; text: string; index: number }
  | { kind: 'tagged'; tag: string; text: string }
  | { kind: 'plain'; text: string };

const TAGS: Record<string, string[]> = {
  result: ['результат', 'result'],
  problem: ['проблема', 'problem'],
  risk: ['риск', 'risk'],
  nextStep: ['следующий шаг', 'next step'],
  recommendation: ['рекомендация', 'recommendation']
};

function detectTag(line: string): { tag: string; rest: string } | null {
  const lower = line.toLowerCase();
  for (const [tag, words] of Object.entries(TAGS)) {
    for (const w of words) {
      const prefix = `${w}:`;
      if (lower.startsWith(prefix)) {
        return { tag, rest: line.slice(prefix.length).trim() };
      }
    }
  }
  return null;
}

export function structureDraft(raw: string, _lang: Language = 'ru'): Block[] {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const blocks: Block[] = [];
  let numberedIndex = 1;

  for (const line of lines) {
    const tagged = detectTag(line);
    if (tagged) {
      blocks.push({ kind: 'tagged', tag: tagged.tag, text: tagged.rest });
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      blocks.push({ kind: 'bullet', text: line.replace(/^[-*•]\s+/, '') });
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      blocks.push({ kind: 'numbered', text: line.replace(/^\d+[.)]\s+/, ''), index: numberedIndex++ });
      continue;
    }
    const isHeadingLike = line.endsWith(':') && line.length < 60 && !/[.!?]$/.test(line.slice(0, -1));
    const isAllCaps = line === line.toUpperCase() && /[А-ЯA-Z]/.test(line) && line.length < 60;
    if (isHeadingLike || isAllCaps) {
      blocks.push({ kind: 'heading', text: line.replace(/:$/, '') });
      continue;
    }
    blocks.push({ kind: 'plain', text: line });
  }
  return blocks;
}

export const TAG_LABELS: Record<string, { ru: string; en: string }> = {
  result: { ru: 'Результаты и показатели', en: 'Results' },
  problem: { ru: 'Проблемы и риски', en: 'Issues & risks' },
  risk: { ru: 'Проблемы и риски', en: 'Issues & risks' },
  nextStep: { ru: 'Следующие шаги', en: 'Next steps' },
  recommendation: { ru: 'Рекомендации', en: 'Recommendations' }
};