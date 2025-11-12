import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { translations, languageOptions, type LanguageCode } from '@/locales/translations'

function resolveTranslation(language: LanguageCode, key: string): string | undefined {
  return translations[language]?.[key]
}

export const useLocaleStore = defineStore('locale', () => {
  const defaultLanguage =
    (localStorage.getItem('kiosk_language') as LanguageCode | null) || 'ko'

  const language = ref<LanguageCode>(defaultLanguage)

  const availableLanguages = languageOptions

  function setLanguage(next: LanguageCode) {
    language.value = next
    localStorage.setItem('kiosk_language', next)
  }

  function t(key: string, fallback: string, params?: Record<string, string | number>) {
    const activeLang = language.value
    let template =
      resolveTranslation(activeLang, key) ??
      (activeLang !== 'ko' ? resolveTranslation('ko', key) : undefined) ??
      fallback

    if (!template) return ''

    if (params) {
      template = template.replace(/\{(\w+)\}/g, (_, token) => {
        const value = params[token]
        return value != null ? String(value) : ''
      })
    }

    return template
  }

  const languageLabel = computed(
    () => availableLanguages.find(lang => lang.code === language.value)?.label ?? '한국어',
  )

  return {
    language,
    languageLabel,
    availableLanguages,
    setLanguage,
    t,
  }
})
