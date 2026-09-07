import { safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import { getSecureDir } from '../paths';

const KEY_FILE = () => path.join(getSecureDir(), 'ai_key.bin');
const PLAINTEXT_WARNING_FILE = () => path.join(getSecureDir(), 'ai_key.plain.txt');

export function saveApiKey(key: string): { warning?: string } {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key);
    fs.writeFileSync(KEY_FILE(), encrypted);
    if (fs.existsSync(PLAINTEXT_WARNING_FILE())) fs.unlinkSync(PLAINTEXT_WARNING_FILE());
    return {};
  }
  // fallback: ОС не предоставляет защищённое хранилище (например, Linux без keyring)
  fs.writeFileSync(PLAINTEXT_WARNING_FILE(), key, { mode: 0o600 });
  return { warning: 'Системное защищённое хранилище недоступно. Ключ сохранён в виде обычного файла с ограниченными правами доступа.' };
}

export function loadApiKey(): string | null {
  if (fs.existsSync(KEY_FILE()) && safeStorage.isEncryptionAvailable()) {
    const buf = fs.readFileSync(KEY_FILE());
    try { return safeStorage.decryptString(buf); } catch { return null; }
  }
  if (fs.existsSync(PLAINTEXT_WARNING_FILE())) {
    return fs.readFileSync(PLAINTEXT_WARNING_FILE(), 'utf-8');
  }
  return null;
}

export function hasApiKey(): boolean {
  return fs.existsSync(KEY_FILE()) || fs.existsSync(PLAINTEXT_WARNING_FILE());
}

export function deleteApiKey() {
  if (fs.existsSync(KEY_FILE())) fs.unlinkSync(KEY_FILE());
  if (fs.existsSync(PLAINTEXT_WARNING_FILE())) fs.unlinkSync(PLAINTEXT_WARNING_FILE());
}