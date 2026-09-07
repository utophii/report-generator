import React, { useContext, useEffect, useState } from 'react';
import { RouteContext } from '../App';
import { useAppStore } from '../store/store';
import { api } from '../api/bridge';
import { t } from '../i18n/i18n';

export default function SettingsPage() {
  const { navigate } = useContext(RouteContext);
  const { settings, updateSettings } = useAppStore();
  const lang = settings.uiLanguage;
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => { api.ai.hasKey().then(setHasKey); }, []);

  async function pickFolder() {
    const p = await api.dialogs.chooseFolder();
    if (p) updateSettings({ defaultExportDir: p });
  }
  async function saveKey() {
    const res = await api.ai.setKey(keyInput);
    if (res?.warning) setWarning(res.warning);
    setKeyInput('');
    setHasKey(true);
  }
  async function deleteKey() {
    await api.ai.deleteKey();
    setHasKey(false);
  }

  return (
    <div className="page">
      <header className="topbar">
        <button onClick={() => navigate({ name: 'home' })}>←</button>
        <h1>{t('settings', lang)}</h1>
      </header>

      <section className="settings-block">
        <h3>{lang === 'ru' ? 'Общие' : 'General'}</h3>
        <label>{lang === 'ru' ? 'Язык интерфейса' : 'UI language'}
          <select value={settings.uiLanguage} onChange={e => updateSettings({ uiLanguage: e.target.value as any })}>
            <option value="ru">Русский</option><option value="en">English</option>
          </select>
        </label>
        <label>{lang === 'ru' ? 'Папка экспорта по умолчанию' : 'Default export folder'}
          <input readOnly value={settings.defaultExportDir ?? ''} />
          <button onClick={pickFolder}>{lang === 'ru' ? 'Выбрать…' : 'Choose…'}</button>
        </label>
      </section>

      <section className="settings-block">
        <h3>ИИ</h3>
        <label><input type="checkbox" checked={settings.aiEnabled} onChange={e => updateSettings({ aiEnabled: e.target.checked })} /> {lang === 'ru' ? 'Включить ИИ-функции' : 'Enable AI features'}</label>
        <label>{lang === 'ru' ? 'Провайдер' : 'Provider'}
          <select value={settings.aiProvider} onChange={e => updateSettings({ aiProvider: e.target.value as any })}>
            <option value="openai">OpenAI-совместимый</option>
            <option value="custom">Другой (свой endpoint)</option>
          </select>
        </label>
        <label>Base URL <input value={settings.aiBaseUrl} onChange={e => updateSettings({ aiBaseUrl: e.target.value })} /></label>
        <label>{lang === 'ru' ? 'Модель' : 'Model'} <input value={settings.aiModel} onChange={e => updateSettings({ aiModel: e.target.value })} /></label>
        <div>
          {hasKey ? (
            <>
              <span>{lang === 'ru' ? 'Ключ сохранён' : 'Key is saved'} ✓</span>
              <button onClick={deleteKey}>{lang === 'ru' ? 'Удалить ключ' : 'Delete key'}</button>
            </>
          ) : (
            <>
              <input type="password" placeholder="API key" value={keyInput} onChange={e => setKeyInput(e.target.value)} />
              <button onClick={saveKey} disabled={!keyInput}>{lang === 'ru' ? 'Сохранить ключ' : 'Save key'}</button>
            </>
          )}
        </div>
        {warning && <div className="hint">{warning}</div>}
        <p className="hint">{lang === 'ru'
          ? 'Ключ хранится только локально и никогда не включается в шаблоны, отчёты или журналы.'
          : 'The key is stored locally only and is never included in templates, reports, or logs.'}</p>
      </section>
    </div>
  );
}