import { v4 as uuid } from 'uuid';
import { Section, Template, Language } from './types';

function field(label: string, type: Section['fields'][number]['type'], required = false): Section['fields'][number] {
  return { id: uuid(), label, type, required, order: 0, value: type === 'list' ? [] : type === 'number' ? null : '' } as any;
}

function section(title: string, level: 1 | 2 | 3, order: number, fields: Section['fields']): Section {
  return {
    id: uuid(), title, level, required: false, order, showInToc: true,
    fields: fields.map((f, i) => ({ ...f, order: i }))
  };
}

const TITLES: Record<Language, string[]> = {
  ru: ['Титульная информация', 'Краткое резюме', 'Цели и контекст', 'Выполненные работы',
       'Результаты и показатели', 'Табличные данные', 'Проблемы и риски', 'Рекомендации',
       'Следующие шаги', 'Приложения'],
  en: ['Cover information', 'Executive summary', 'Goals & context', 'Work performed',
       'Results & metrics', 'Tabular data', 'Issues & risks', 'Recommendations',
       'Next steps', 'Appendices']
};

export function buildEmptyTemplate(language: Language): Template {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    name: language === 'ru' ? 'Пустой шаблон' : 'Blank template',
    description: '',
    language, theme: 'modern',
    createdAt: now, updatedAt: now,
    sections: []
  };
}

export function buildStandardTemplate(language: Language): Template {
  const now = new Date().toISOString();
  const titles = TITLES[language];
  const sections: Section[] = [
    section(titles[0], 1, 0, [field(language === 'ru' ? 'Автор' : 'Author', 'text'), field(language === 'ru' ? 'Клиент/проект' : 'Client/project', 'text')]),
    section(titles[1], 1, 1, [field(language === 'ru' ? 'Краткое резюме' : 'Summary', 'textarea')]),
    section(titles[2], 1, 2, [field(language === 'ru' ? 'Описание' : 'Description', 'richtext')]),
    section(titles[3], 1, 3, [field(language === 'ru' ? 'Описание работ' : 'Work description', 'richtext')]),
    section(titles[4], 1, 4, [field(language === 'ru' ? 'Показатели' : 'Metrics', 'table')]),
    section(titles[5], 1, 5, [field(language === 'ru' ? 'Таблица' : 'Table', 'table')]),
    section(titles[6], 1, 6, [field(language === 'ru' ? 'Список' : 'List', 'list')]),
    section(titles[7], 1, 7, [field(language === 'ru' ? 'Рекомендации' : 'Recommendations', 'list')]),
    section(titles[8], 1, 8, [field(language === 'ru' ? 'Следующие шаги' : 'Next steps', 'list')]),
    section(titles[9], 1, 9, [field(language === 'ru' ? 'Приложение' : 'Appendix', 'image')])
  ];
  return {
    id: uuid(),
    name: language === 'ru' ? 'Стандартный отчёт' : 'Standard report',
    description: '', language, theme: 'modern', createdAt: now, updatedAt: now, sections
  };
}