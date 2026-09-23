import { getRequestConfig } from 'next-intl/server';

const locales = ['ta', 'en'];
const defaultLocale = 'ta';

export default getRequestConfig(async ({ requestLocale }) => {
  // In next-intl v4, requestLocale is a Promise<string | undefined>
  let locale = await requestLocale;

  // Fall back to default if locale is missing or invalid
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  // Static imports — Turbopack cannot resolve dynamic template literals
  let messages;
  if (locale === 'en') {
    messages = (await import('../messages/en.json')).default;
  } else {
    messages = (await import('../messages/ta.json')).default;
  }

  return { locale, messages };
});
