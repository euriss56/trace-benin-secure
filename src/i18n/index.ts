import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from '@/locales/fr/translation.json';
import en from '@/locales/en/translation.json';
import es from '@/locales/es/translation.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en', 'es'],
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tib-lang',
      caches: ['localStorage'],
    },
  });

export const SUPPORTED_LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'es', label: 'ES', flag: '🇪🇸', name: 'Español' },
] as const;

export default i18n;
