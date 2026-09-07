import { ipcMain, dialog, shell, BrowserWindow, app } from 'electron';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import * as DB from '../db/database';
import { Template, Report, AppSettings, AiActionRequest } from '../../shared/types';
import { buildDefaultBaseName, resolveNonConflictingPath, sanitizeFileName } from '../../shared/fileNaming';
import { exportReportToPdf } from '../export/pdfExport';
import { exportReportToDocx } from '../export/docxExport';
import { exportReportToXlsx } from '../export/xlsxExport';
import { parseImportFile, loadFullSheet } from '../services/importService';
import { runAiAction } from '../services/aiService';
import { saveApiKey, loadApiKey, deleteApiKey, hasApiKey } from '../services/secureStore';
import { getImagesDir, getUserDataPath, getLogPath } from '../paths';

function logError(context: string, err: unknown) {
  const line = `[${new Date().toISOString()}] ${context}: ${(err as Error)?.message || err}\n`;
  try { fs.appendFileSync(getLogPath(), line); } catch { /* ignore */ }
  console.error(line);
}

export function registerIpcHandlers() {
  DB.initDb();

  // ---------- Templates ----------
  ipcMain.handle('templates:list', () => DB.listTemplates());
  ipcMain.handle('templates:get', (_e, id: string) => DB.getTemplateById(id));
  ipcMain.handle('templates:save', (_e, t: Template) => { DB.upsertTemplate(t); return t; });
  ipcMain.handle('templates:delete', (_e, id: string) => { DB.deleteTemplate(id); return true; });

  // ---------- Reports ----------
  ipcMain.handle('reports:list', () => DB.listReports());
  ipcMain.handle('reports:get', (_e, id: string) => DB.getReportById(id));
  ipcMain.handle('reports:save', (_e, r: Report) => { r.updatedAt = new Date().toISOString(); DB.upsertReport(r); return r; });
  ipcMain.handle('reports:delete', (_e, id: string) => { DB.deleteReport(id); return true; });
  ipcMain.handle('reports:createFromTemplate', (_e, payload: { template: Template | null; title: string; language: 'ru' | 'en' }) => {
    const now = new Date().toISOString();
    const cloneSections = payload.template ? JSON.parse(JSON.stringify(payload.template.sections)) : [];
    // независимая копия: новые id, чтобы редактирование черновика не влияло на шаблон
    const remap = (sections: any[]) => sections.map((s: any) => ({
      ...s, id: uuid(), fields: s.fields.map((f: any) => ({ ...f, id: uuid() }))
    }));
    const report: Report = {
      id: uuid(),
      templateId: payload.template?.id ?? null,
      title: payload.title || 'Новый отчёт',
      period: '',
      author: '',
      language: payload.language,
      theme: payload.template?.theme ?? 'modern',
      status: 'draft',
      sections: remap(cloneSections),
      createdAt: now, updatedAt: now
    };
    DB.upsertReport(report);
    return report;
  });

  // ---------- Settings ----------
  ipcMain.handle('settings:get', () => DB.getSettings());
  ipcMain.handle('settings:set', (_e, s: AppSettings) => { DB.setSettings(s); return s; });

  // ---------- AI ----------
  ipcMain.handle('ai:hasKey', () => hasApiKey());
  ipcMain.handle('ai:setKey', (_e, key: string) => saveApiKey(key));
  ipcMain.handle('ai:deleteKey', () => { deleteApiKey(); return true; });
  ipcMain.handle('ai:process', async (_e, req: AiActionRequest) => {
    const settings = DB.getSettings();
    try {
      return { ok: true, text: await runAiAction(settings, req) };
    } catch (err) {
      logError('ai:process', err);
      return { ok: false, error: (err as Error).message };
    }
  });

  // ---------- Dialogs / files ----------
  ipcMain.handle('dialog:openImportFile', async () => {
    const res = await dialog.showOpenDialog({
      filters: [{ name: 'Таблицы', extensions: ['csv', 'xlsx'] }],
      properties: ['openFile']
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('dialog:chooseFolder', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('dialog:pickImage', async () => {
    const res = await dialog.showOpenDialog({ filters: [{ name: 'Изображения', extensions: ['png', 'jpg', 'jpeg'] }], properties: ['openFile'] });
    if (res.canceled || res.filePaths.length === 0) return null;
    const src = res.filePaths[0];
    const ext = path.extname(src);
    const dest = path.join(getImagesDir(), `${uuid()}${ext}`);
    fs.copyFileSync(src, dest);
    return dest;
  });

  ipcMain.handle('images:saveDataUrl', (_e, dataUrl: string) => {
    const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl);
    if (!match) throw new Error('Некорректный формат изображения');
    const ext = match[1] === 'jpeg' ? 'jpg' : 'png';
    const dest = path.join(getImagesDir(), `${uuid()}.${ext}`);
    fs.writeFileSync(dest, Buffer.from(match[2], 'base64'));
    return dest;
  });

  ipcMain.handle('images:getDataUrl', (_e, filePath: string) => {
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    return `data:image/${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
  });

  ipcMain.handle('app:openDataFolder', () => { shell.openPath(getUserDataPath()); return true; });

  // ---------- Import ----------
  ipcMain.handle('import:parseFile', async (_e, filePath: string) => {
    try {
      return { ok: true, data: await parseImportFile(filePath) };
    } catch (err) {
      logError('import:parseFile', err);
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcMain.handle('import:loadFullSheet', async (_e, filePath: string, sheetName?: string) => {
    try {
      return { ok: true, data: await loadFullSheet(filePath, sheetName) };
    } catch (err) {
      logError('import:loadFullSheet', err);
      return { ok: false, error: (err as Error).message };
    }
  });

  // ---------- Export ----------
  async function doExport(report: Report, format: 'pdf' | 'docx' | 'xlsx', win: BrowserWindow | null) {
    const settings = DB.getSettings();
    const baseDir = settings.defaultExportDir && fs.existsSync(settings.defaultExportDir)
      ? settings.defaultExportDir
      : app.getPath('documents');
    const baseName = buildDefaultBaseName(report.title, report.period);
    const defaultPath = resolveNonConflictingPath(baseDir, baseName, format);

    const res = await dialog.showSaveDialog(win ?? undefined as any, {
      defaultPath,
      filters: [{ name: format.toUpperCase(), extensions: [format] }]
    });
    if (res.canceled || !res.filePath) return { ok: false, cancelled: true };

    const filePath = res.filePath;
    try {
      if (format === 'pdf') await exportReportToPdf(report, filePath);
      if (format === 'docx') await exportReportToDocx(report, filePath);
      if (format === 'xlsx') await exportReportToXlsx(report, filePath);
      DB.addExportRecord({ id: uuid(), reportId: report.id, format, filePath, createdAt: new Date().toISOString() });
      return { ok: true, filePath };
    } catch (err) {
      logError(`export:${format}`, err);
      return { ok: false, error: (err as Error).message };
    }
  }

  ipcMain.handle('export:run', async (event, payload: { report: Report; format: 'pdf' | 'docx' | 'xlsx' }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return doExport(payload.report, payload.format, win);
  });

  ipcMain.handle('exports:list', (_e, reportId: string) => DB.listExportsForReport(reportId));
}