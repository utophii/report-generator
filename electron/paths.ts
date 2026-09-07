import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export function getUserDataPath() {
  return app.getPath('userData');
}
export function getDbPath() {
  return path.join(getUserDataPath(), 'data.sqlite3');
}
export function getImagesDir() {
  const dir = path.join(getUserDataPath(), 'images');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export function getSecureDir() {
  const dir = path.join(getUserDataPath(), 'secure');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export function getTmpDir() {
  const dir = path.join(getUserDataPath(), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
export function getLogPath() {
  return path.join(getUserDataPath(), 'error.log');
}