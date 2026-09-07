import { create } from 'zustand';
import { AppSettings, Language } from '@shared/types';
import { api } from '../api/bridge';

interface AppState {
  settings: AppSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  uiLang: () => Language;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: { uiLanguage: 'ru', defaultExportDir: null, aiEnabled: false, aiProvider: 'openai', aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini' },
  loaded: false,
  loadSettings: async () => { const s = await api.settings.get(); set({ settings: s, loaded: true }); },
  updateSettings: async (patch) => { const s = { ...get().settings, ...patch }; await api.settings.set(s); set({ settings: s }); },
  uiLang: () => get().settings.uiLanguage
}));