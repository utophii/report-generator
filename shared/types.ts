export type Language = 'ru' | 'en';
export type ThemeId = 'strict' | 'modern' | 'minimal';

export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'number' | 'date'
  | 'select' | 'list' | 'table' | 'image' | 'chart';

export interface TableColumn {
  key: string;
  label: string;
  numeric: boolean;
  format?: 'number' | 'percent';
}

export interface TableValue {
  columns: TableColumn[];
  rows: Record<string, string | number | null>[];
  sourceFileMeta?: { fileName: string; sheet?: string; importedAt: string };
}

export interface ChartValue {
  sourceFieldId: string | null;
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  categoryColumn: string | null;
  valueColumns: string[];
  showLegend: boolean;
  imagePath?: string | null;
}

export interface ImageValue {
  path: string;
  caption?: string;
}

export type FieldValue =
  | string | number | null | string[] | TableValue | ChartValue | ImageValue;

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  hint?: string;
  options?: string[]; // для select
  value: FieldValue;
}

export interface Section {
  id: string;
  title: string;
  hint?: string;
  level: 1 | 2 | 3;
  required: boolean;
  order: number;
  showInToc: boolean;
  collapsed?: boolean;
  fields: Field[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  language: Language;
  theme: ThemeId;
  createdAt: string;
  updatedAt: string;
}

export interface Template extends TemplateMeta {
  sections: Section[];
}

export type ReportStatus = 'draft' | 'final';

export interface Report {
  id: string;
  templateId: string | null;
  title: string;
  period: string;
  author: string;
  language: Language;
  theme: ThemeId;
  status: ReportStatus;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportRecord {
  id: string;
  reportId: string;
  format: 'pdf' | 'docx' | 'xlsx';
  filePath: string;
  createdAt: string;
}

export type AiProvider = 'openai' | 'custom';

export interface AppSettings {
  uiLanguage: Language;
  defaultExportDir: string | null;
  aiEnabled: boolean;
  aiProvider: AiProvider;
  aiBaseUrl: string;
  aiModel: string;
}

export interface AiActionRequest {
  action: 'structure' | 'summarize' | 'improve' | 'translate' | 'suggest';
  text: string;
  targetLanguage?: Language;
}