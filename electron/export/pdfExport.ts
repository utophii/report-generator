import { BrowserWindow } from 'electron';
import fs from 'fs';
import { Report } from '../../shared/types';
import { buildReportHtml } from './htmlBuilder';

export async function exportReportToPdf(report: Report, filePath: string): Promise<void> {
  const html = buildReportHtml(report);
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const buffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 } as any
    });
    fs.writeFileSync(filePath, buffer);
  } finally {
    win.destroy();
  }
}