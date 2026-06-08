import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'
import ar from './locales/ar.json'

const supportedLanguages = ['de', 'en', 'ar']
const savedLanguage = localStorage.getItem('app_language')
const initialLanguage = supportedLanguages.includes(savedLanguage) ? savedLanguage : 'de'

const applyDocumentLanguage = (language) => {
  const normalizedLanguage = supportedLanguages.includes(language) ? language : 'de'
  document.documentElement.lang = normalizedLanguage
  document.documentElement.dir = normalizedLanguage === 'ar' ? 'rtl' : 'ltr'
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLanguage,
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false,
  },
})

applyDocumentLanguage(initialLanguage)

i18n.on('languageChanged', (language) => {
  const normalizedLanguage = supportedLanguages.includes(language) ? language : 'de'
  localStorage.setItem('app_language', normalizedLanguage)
  applyDocumentLanguage(normalizedLanguage)
})

export default i18n
