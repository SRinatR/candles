
export const i18nAdmin = {
  defaultLocale: 'en',
  locales: ['en', 'ru'],
} as const;

export type AdminLocale = (typeof i18nAdmin)['locales'][number];
export type I18nAdminConfig = typeof i18nAdmin;
