import { LOCALES, type LocaleId } from '../types'
import { LOCALE_NAMES, useI18n } from '../i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, dict } = useI18n()
  return (
    <select
      className="language-switcher"
      value={locale}
      aria-label={dict.ui.language}
      onChange={(e) => setLocale(e.target.value as LocaleId)}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>{LOCALE_NAMES[l]}</option>
      ))}
    </select>
  )
}
