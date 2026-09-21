import React from 'react';
import { useAppStore } from '../store/store';
import { t } from '../i18n/i18n';

export default function ThemeToggle() {
  const { settings, updateSettings } = useAppStore();
  const lang = settings.uiLanguage;

  const isDark = settings.uiTheme === 'dark' ||
    (settings.uiTheme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      title={isDark ? t('themeLight', lang) : t('themeDark', lang)}
      aria-label={isDark ? t('themeLight', lang) : t('themeDark', lang)}
      onClick={() => updateSettings({ uiTheme: isDark ? 'light' : 'dark' })}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
