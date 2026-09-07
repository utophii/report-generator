import fs from 'fs';
import path from 'path';

export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
}

export function buildDefaultBaseName(title: string, period: string): string {
  const t = title?.trim() || 'Отчёт';
  const p = period?.trim();
  return sanitizeFileName(p ? `Отчёт — ${t} — ${p}` : `Отчёт — ${t}`);
}

/** Находит первое свободное имя вида "name.ext" / "name (1).ext" / "name (2).ext" ... */
export function resolveNonConflictingPath(dir: string, baseName: string, ext: string): string {
  let candidate = path.join(dir, `${baseName}.${ext}`);
  if (!fs.existsSync(candidate)) return candidate;
  let i = 1;
  while (true) {
    candidate = path.join(dir, `${baseName} (${i}).${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i++;
  }
}