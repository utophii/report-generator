import Database from 'better-sqlite3';
import { getDbPath } from '../paths';
import { Template, Report, ExportRecord, AppSettings } from '../../shared/types';

let db: Database.Database;

export function initDb() {
  db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY, name TEXT, language TEXT, theme TEXT,
      created_at TEXT, updated_at TEXT, json TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, template_id TEXT, title TEXT, period TEXT,
      language TEXT, theme TEXT, status TEXT,
      created_at TEXT, updated_at TEXT, json TEXT
    );
    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY, report_id TEXT, format TEXT, file_path TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT
    );
  `);
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

// ---------- Templates ----------
export function listTemplates(): Template[] {
  const rows = getDb().prepare('SELECT json FROM templates ORDER BY updated_at DESC').all() as { json: string }[];
  return rows.map(r => JSON.parse(r.json));
}
export function getTemplateById(id: string): Template | null {
  const row = getDb().prepare('SELECT json FROM templates WHERE id = ?').get(id) as { json: string } | undefined;
  return row ? JSON.parse(row.json) : null;
}
export function upsertTemplate(t: Template) {
  const stmt = getDb().prepare(`
    INSERT INTO templates (id, name, language, theme, created_at, updated_at, json)
    VALUES (@id, @name, @language, @theme, @createdAt, @updatedAt, @json)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, language=excluded.language, theme=excluded.theme,
      updated_at=excluded.updated_at, json=excluded.json
  `);
  stmt.run({ id: t.id, name: t.name, language: t.language, theme: t.theme, createdAt: t.createdAt, updatedAt: t.updatedAt, json: JSON.stringify(t) });
}
export function deleteTemplate(id: string) {
  getDb().prepare('DELETE FROM templates WHERE id = ?').run(id);
}

// ---------- Reports ----------
export function listReports(): Report[] {
  const rows = getDb().prepare('SELECT json FROM reports ORDER BY updated_at DESC').all() as { json: string }[];
  return rows.map(r => JSON.parse(r.json));
}
export function getReportById(id: string): Report | null {
  const row = getDb().prepare('SELECT json FROM reports WHERE id = ?').get(id) as { json: string } | undefined;
  return row ? JSON.parse(row.json) : null;
}
export function upsertReport(r: Report) {
  const stmt = getDb().prepare(`
    INSERT INTO reports (id, template_id, title, period, language, theme, status, created_at, updated_at, json)
    VALUES (@id, @templateId, @title, @period, @language, @theme, @status, @createdAt, @updatedAt, @json)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, period=excluded.period, language=excluded.language,
      theme=excluded.theme, status=excluded.status, updated_at=excluded.updated_at, json=excluded.json
  `);
  stmt.run({
    id: r.id, templateId: r.templateId, title: r.title, period: r.period,
    language: r.language, theme: r.theme, status: r.status,
    createdAt: r.createdAt, updatedAt: r.updatedAt, json: JSON.stringify(r)
  });
}
export function deleteReport(id: string) {
  getDb().prepare('DELETE FROM reports WHERE id = ?').run(id);
}

// ---------- Exports ----------
export function addExportRecord(e: ExportRecord) {
  getDb().prepare('INSERT INTO exports (id, report_id, format, file_path, created_at) VALUES (?,?,?,?,?)')
    .run(e.id, e.reportId, e.format, e.filePath, e.createdAt);
}
export function listExportsForReport(reportId: string): ExportRecord[] {
  const rows = getDb().prepare('SELECT * FROM exports WHERE report_id = ? ORDER BY created_at DESC').all(reportId) as any[];
  return rows.map(r => ({ id: r.id, reportId: r.report_id, format: r.format, filePath: r.file_path, createdAt: r.created_at }));
}

// ---------- Settings ----------
const DEFAULT_SETTINGS: AppSettings = {
  uiLanguage: 'ru', defaultExportDir: null,
  aiEnabled: false, aiProvider: 'openai', aiBaseUrl: 'https://api.openai.com/v1', aiModel: 'gpt-4o-mini'
};
export function getSettings(): AppSettings {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get('app') as { value: string } | undefined;
  return row ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) } : DEFAULT_SETTINGS;
}
export function setSettings(s: AppSettings) {
  getDb().prepare('INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run('app', JSON.stringify(s));
}