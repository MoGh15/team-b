import React from 'react'
import { useTranslation } from 'react-i18next'
import './LanguageSwitcher.css'

const languages = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
]

function LanguageSwitcher({ variant = 'light' }) {
  const { t, i18n } = useTranslation()

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
  }

  return (
    <div className={`language-switcher language-switcher--${variant}`} aria-label={t('common.language')}>
      {languages.map((language) => (
        <button
          type="button"
          key={language.code}
          className={i18n.resolvedLanguage === language.code ? 'is-active' : ''}
          onClick={() => changeLanguage(language.code)}
        >
          {language.label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
