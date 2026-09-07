import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (!app.isPackaged) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    registerIpcHandlers();
    createWindow();
  } catch (err) {
    console.error('Fatal startup error:', err);
    dialog.showErrorBox(
      'Ошибка запуска приложения',
      `Не удалось инициализировать приложение:\n\n${(err as Error).message}\n\nСмотрите консоль для подробностей.`
    );
    app.quit();
  }
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});