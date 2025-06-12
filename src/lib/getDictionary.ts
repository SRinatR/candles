
import type { Locale } from './i1n-config';

// We enumerate all dictionaries here for better linting and typescript support
// We do a dynamic import to only load the dictionaries that are needed
const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  ru: () => import('@/dictionaries/ru.json').then((module) => module.default),
  uz: () => import('@/dictionaries/uz.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  const loader = dictionaries[locale] || dictionaries.en; // Fallback to 'en' if locale not found
  return loader();
};
