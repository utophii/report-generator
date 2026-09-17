import { AiActionRequest, AppSettings, Language } from '../../shared/types';
import { loadApiKey } from './secureStore';

function buildPrompt(req: AiActionRequest): { system: string; user: string } {
  const lang = req.targetLanguage === 'en' ? 'English' : 'Russian';
  switch (req.action) {
    case 'structure':
      return { system: 'Ты помощник, который превращает черновые заметки в чёткий структурированный текст раздела отчёта. Не выдумывай факты.', user: req.text };
    case 'summarize':
      return { system: 'Сформулируй краткое резюме (executive summary) на основе текста отчёта, 3-6 предложений.', user: req.text };
    case 'improve':
      return { system: 'Улучши стиль и ясность текста, сохрани смысл и факты, не добавляй новых данных.', user: req.text };
    case 'translate':
      return { system: `Переведи следующий текст на ${lang}, сохрани форматирование списков.`, user: req.text };
    case 'suggest':
      return { system: 'На основе заметок предложи списком риски, рекомендации и следующие шаги.', user: req.text };
  }
}

export async function runAiAction(settings: AppSettings, req: AiActionRequest): Promise<string> {
  const ru = settings.uiLanguage === 'ru';
  if (!settings.aiEnabled) throw new Error(ru ? 'ИИ-функции отключены в настройках' : 'AI features are disabled in Settings');
  const apiKey = loadApiKey();
  if (!apiKey) throw new Error(ru ? 'API-ключ не настроен' : 'API key is not configured');

  const { system, user } = buildPrompt(req);
  const url = `${settings.aiBaseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: settings.aiModel,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature: 0.4
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${ru ? 'Ошибка провайдера ИИ' : 'AI provider error'} (${res.status}): ${errText.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(ru ? 'Провайдер вернул пустой ответ' : 'The provider returned an empty response');
  return content as string;
}