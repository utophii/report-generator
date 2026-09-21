import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/store';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplateEditorPage from './pages/TemplateEditorPage';
import ReportEditorPage from './pages/ReportEditorPage';
import PreviewPage from './pages/PreviewPage';
import SettingsPage from './pages/SettingsPage';
import ErrorBoundary from './components/ErrorBoundary';

export type Route =
  | { name: 'home' }
  | { name: 'templates' }
  | { name: 'templateEditor'; id: string | null }
  | { name: 'reportEditor'; id: string }
  | { name: 'preview'; id: string }
  | { name: 'settings' };

export const RouteContext = React.createContext<{ route: Route; navigate: (r: Route) => void }>(null as any);

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const { loadSettings, loaded, settings } = useAppStore();

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = settings.uiTheme === 'system' ? (media.matches ? 'dark' : 'light') : settings.uiTheme;
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    };
    apply();
    if (settings.uiTheme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [settings.uiTheme]);

  if (!loaded) return <div className="loading">Загрузка…</div>;

  const ctx = { route, navigate: setRoute };
  return (
    <RouteContext.Provider value={ctx}>
      <ErrorBoundary onReset={() => setRoute({ name: 'home' })} key={JSON.stringify(route)}>
        {route.name === 'home' && <HomePage />}
        {route.name === 'templates' && <TemplatesPage />}
        {route.name === 'templateEditor' && <TemplateEditorPage id={route.id} />}
        {route.name === 'reportEditor' && <ReportEditorPage id={route.id} />}
        {route.name === 'preview' && <PreviewPage id={route.id} />}
        {route.name === 'settings' && <SettingsPage />}
      </ErrorBoundary>
    </RouteContext.Provider>
  );
}