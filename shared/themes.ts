import { ThemeId } from './types';

export interface ThemeTokens {
  id: ThemeId;
  name: { ru: string; en: string };
  fontFamily: string;
  headingColor: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
  coverBackground: string;
  tableHeaderBg: string;
}

export const THEMES: Record<ThemeId, ThemeTokens> = {
  strict: {
    id: 'strict',
    name: { ru: 'Строгая', en: 'Strict' },
    fontFamily: "'Times New Roman', Georgia, serif",
    headingColor: '#000000',
    accentColor: '#333333',
    textColor: '#111111',
    borderColor: '#000000',
    coverBackground: '#ffffff',
    tableHeaderBg: '#e0e0e0'
  },
  modern: {
    id: 'modern',
    name: { ru: 'Современная', en: 'Modern' },
    fontFamily: "'Segoe UI', Arial, sans-serif",
    headingColor: '#173B6C',
    accentColor: '#2E7DD1',
    textColor: '#1c1c1c',
    borderColor: '#d5e2f0',
    coverBackground: '#F3F8FF',
    tableHeaderBg: '#D9E9FB'
  },
  minimal: {
    id: 'minimal',
    name: { ru: 'Минималистичная', en: 'Minimal' },
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    headingColor: '#222222',
    accentColor: '#888888',
    textColor: '#2b2b2b',
    borderColor: '#eeeeee',
    coverBackground: '#ffffff',
    tableHeaderBg: '#fafafa'
  }
};