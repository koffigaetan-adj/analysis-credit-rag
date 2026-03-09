import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationFR from '../locales/fr/translation.json';
import translationEN from '../locales/en/translation.json';
import translationES from '../locales/es/translation.json';

const resources = {
     fr: { translation: translationFR },
     en: { translation: translationEN },
     es: { translation: translationES },
};

i18n
     .use(initReactI18next)
     .init({
          resources,
          lng: 'fr', // Langue par défaut
          fallbackLng: 'en', // Langue de repli si une clé manque en français

          interpolation: {
               escapeValue: false, // React gère déjà l'échappement XSS
          },
     });

export default i18n;
