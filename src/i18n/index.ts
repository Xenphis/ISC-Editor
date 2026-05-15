import { createI18n } from 'vue-i18n'
import fr from '@/i18n/locales/fr.json'
import en from '@/i18n/locales/en.json'
import npcFr from '@/modules/npc/i18n/fr.json'
import npcEn from '@/modules/npc/i18n/en.json'
import goFr from '@/modules/game_objects/i18n/fr.json'
import goEn from '@/modules/game_objects/i18n/en.json'
import itemFr from '@/modules/item/i18n/fr.json'
import itemEn from '@/modules/item/i18n/en.json'
import questFr from '@/modules/quests/i18n/fr.json'
import questEn from '@/modules/quests/i18n/en.json'
import mapFr from '@/modules/map/i18n/fr.json'
import mapEn from '@/modules/map/i18n/en.json'
import lootItemFr from '@/modules/loot_and_item/i18n/fr.json'
import lootItemEn from '@/modules/loot_and_item/i18n/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    fr,
    en,
  },
})

i18n.global.mergeLocaleMessage('fr', npcFr)
i18n.global.mergeLocaleMessage('en', npcEn)
i18n.global.mergeLocaleMessage('fr', goFr)
i18n.global.mergeLocaleMessage('en', goEn)
i18n.global.mergeLocaleMessage('fr', itemFr)
i18n.global.mergeLocaleMessage('en', itemEn)
i18n.global.mergeLocaleMessage('fr', questFr)
i18n.global.mergeLocaleMessage('en', questEn)
i18n.global.mergeLocaleMessage('fr', mapFr)
i18n.global.mergeLocaleMessage('en', mapEn)
i18n.global.mergeLocaleMessage('fr', lootItemFr)
i18n.global.mergeLocaleMessage('en', lootItemEn)

export default i18n
