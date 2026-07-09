import React, { useEffect, useState } from 'react'
import './CookieConsent.css'

const STORAGE_KEY = 'clinic-cookie-consent'

const defaultConsent = {
  necessary: true,
  preferences: false,
}

function readStoredConsent() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    return storedValue ? JSON.parse(storedValue) : null
  } catch (error) {
    return null
  }
}

function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasStoredConsent, setHasStoredConsent] = useState(false)
  const [preferencesEnabled, setPreferencesEnabled] = useState(false)

  useEffect(() => {
    const storedConsent = readStoredConsent()

    if (storedConsent) {
      setHasStoredConsent(true)
      setPreferencesEnabled(Boolean(storedConsent.preferences))
      return
    }

    setIsOpen(true)
  }, [])

  const saveConsent = (preferences) => {
    const consent = {
      ...defaultConsent,
      preferences,
      updatedAt: new Date().toISOString(),
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    } catch (error) {
      // Consent still closes when storage is unavailable.
    }

    setPreferencesEnabled(preferences)
    setHasStoredConsent(true)
    setIsOpen(false)
  }

  const openSettings = () => {
    const storedConsent = readStoredConsent()

    if (storedConsent) {
      setPreferencesEnabled(Boolean(storedConsent.preferences))
    }

    setIsOpen(true)
  }

  if (!isOpen) {
    if (!hasStoredConsent) {
      return null
    }

    return (
      <button
        type="button"
        className="cookie-settings-trigger"
        onClick={openSettings}
      >
        إعدادات ملفات الارتباط
      </button>
    )
  }

  return (
    <section
      className="cookie-consent"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent__panel">
        <p className="cookie-consent__eyebrow">حماية البيانات</p>
        <h2 id="cookie-consent-title">ملفات تعريف الارتباط والإعدادات</h2>
        <p className="cookie-consent__intro">
          Wir nutzen notwendige Cookies for Anmeldung und Sicherheit. اختياري
          kannst du Präferenzen (z. B. Sprache/Theme) speichern lassen.
        </p>

        <div className="cookie-consent__options" aria-label="Cookie-Kategorien">
          <article className="cookie-option">
            <div>
              <h3>Notwendig</h3>
              <p>Erforderlich für Session, Authentifizierung und sichere Nutzung.</p>
            </div>
            <span className="cookie-option__badge">دائمًا نشط</span>
          </article>

          <article className="cookie-option">
            <div>
              <h3>التفضيلات</h3>
              <p>Speichert deine Sprache and das Theme for ein persönliches Erlebnis.</p>
            </div>
            <button
              type="button"
              className={`cookie-switch${preferencesEnabled ? ' is-on' : ''}`}
              role="switch"
              aria-checked={preferencesEnabled}
              aria-label="تفعيل ملفات تعريف ارتباط التفضيلات"
              onClick={() => setPreferencesEnabled((current) => !current)}
            >
              <span />
            </button>
          </article>
        </div>

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="cookie-button cookie-button--muted"
            onClick={() => saveConsent(false)}
          >
            Nur notwendige
          </button>
          <button
            type="button"
            className="cookie-button cookie-button--light"
            onClick={() => saveConsent(preferencesEnabled)}
          >
            تخزين الاختيارات
          </button>
          <button
            type="button"
            className="cookie-button cookie-button--primary"
            onClick={() => saveConsent(true)}
          >
            Alle akzeptieren
          </button>
        </div>

        <p className="cookie-consent__note">
          يمكنك تغيير اختياراتك لاحقًا من إعدادات ملفات الارتباط.
        </p>
      </div>
    </section>
  )
}

export default CookieConsent
