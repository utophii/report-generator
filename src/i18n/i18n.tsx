import { Language } from '@shared/types';

const dict = {
  ru: {
    newReport: 'Новый отчёт', recent: 'Недавние отчёты', templates: 'Шаблоны', settings: 'Настройки',
    search: 'Поиск по названию…', openDataFolder: 'Открыть папку данных', blankTemplate: 'Пустой шаблон',
    save: 'Сохранить', saving: 'Сохранение…', saved: 'Сохранено', delete: 'Удалить', duplicate: 'Дублировать',
    preview: 'Предпросмотр', exportBtn: 'Экспорт', backToEdit: 'Назад к редактированию', theme: 'Тема',
    addSection: 'Добавить раздел', addField: 'Добавить поле', title: 'Заголовок', period: 'Период',
    author: 'Автор', language: 'Язык содержимого', required: 'Обязательное', cancel: 'Отмена', apply: 'Применить',
    confirmDeleteTemplate: 'Удалить шаблон без возможности восстановления?', confirmDeleteReport: 'Удалить отчёт без возможности восстановления?'
  },
  en: {
    newReport: 'New report', recent: 'Recent reports', templates: 'Templates', settings: 'Settings',
    search: 'Search by title…', openDataFolder: 'Open data folder', blankTemplate: 'Blank template',
    save: 'Save', saving: 'Saving…', saved: 'Saved', delete: 'Delete', duplicate: 'Duplicate',
    preview: 'Preview', exportBtn: 'Export', backToEdit: 'Back to editing', theme: 'Theme',
    addSection: 'Add section', addField: 'Add field', title: 'Title', period: 'Period',
    author: 'Author', language: 'Content language', required: 'Required', cancel: 'Cancel', apply: 'Apply',
    confirmDeleteTemplate: 'Delete this template permanently?', confirmDeleteReport: 'Delete this report permanently?'
  }
} as const;

export function t(key: keyof typeof dict['ru'], lang: Language): string {
  return dict[lang][key] ?? key;
}