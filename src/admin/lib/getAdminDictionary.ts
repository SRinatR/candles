
import type { AdminLocale } from './i18n-config-admin';

// We enumerate all dictionaries here for better linting and typescript support
// We do a dynamic import to only load the dictionaries that are needed
const dictionaries = {
  en: () => import('@/admin/dictionaries/en.json').then((module) => module.default),
  ru: () => import('@/admin/dictionaries/ru.json').then((module) => module.default),
};

export const getAdminDictionary = (locale: AdminLocale) => {
  const loader = dictionaries[locale] || dictionaries.en; // Fallback to 'en' if locale not found
  return loader();
};
