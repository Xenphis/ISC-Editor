import { createI18n } from 'vue-i18n'
import fr from '@core/i18n/locales/fr.json'
import en from '@core/i18n/locales/en.json'
import { moduleI18nMessages } from '@/modules/registry'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    fr,
    en,
  },
})

for (const { locale, messages } of moduleI18nMessages) {
  i18n.global.mergeLocaleMessage(locale, messages)
}

export default i18n
