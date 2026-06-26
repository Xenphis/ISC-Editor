import type { RouteRecordRaw } from 'vue-router'
import type { ModuleStore } from '@/stores/moduleStore'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useGameObjectModuleStore } from '@/modules/game_objects/store'
import { useQuestModuleStore } from '@/modules/quests/store'
import { useGameTeleStore } from '@/modules/map/stores/game_tele'
import { useExplorationBasexpStore } from '@/modules/map/stores/exploration_basexp'
import { useInstanceStore } from '@/modules/map/stores/instance'
import { npcRoutes } from '@/modules/npc/routes'
import { gameObjectRoutes } from '@/modules/game_objects/routes'
import { itemRoutes } from '@/modules/item/routes'
import { questRoutes } from '@/modules/quests/routes'
import { mapRoutes } from '@/modules/map/routes'
import { lootAndItemRoutes } from '@/modules/loot_and_item/routes'
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
import modelViewerFr from '@/modules/model_viewer/i18n/fr.json'
import modelViewerEn from '@/modules/model_viewer/i18n/en.json'

export type AppLocale = 'en' | 'fr'

type LocaleMessages = Record<string, unknown>

export interface ModuleNavigationDefinition {
  id: string
  icon: string
}

export interface ModuleNavigationItem extends ModuleNavigationDefinition {
  path: string
}

export interface ModuleI18nDefinition {
  en: LocaleMessages
  fr: LocaleMessages
}

export interface AppModuleDefinition {
  id: string
  basePath: string
  routes: RouteRecordRaw[]
  navigation?: ModuleNavigationDefinition
  i18n?: ModuleI18nDefinition
  sessionStore?: () => ModuleStore
  sessionStores?: (() => ModuleStore)[]
}

export interface ModuleI18nMessages {
  locale: AppLocale
  messages: LocaleMessages
}

export const sqlSessionRoute: RouteRecordRaw = {
  path: 'sql-session',
  name: 'sql-session',
  component: () => import('@/pages/modules/sql-session/SqlSessionModule.vue'),
}

export const appModules: AppModuleDefinition[] = [
  {
    id: 'npc',
    basePath: '/npc',
    navigation: { id: 'npc', icon: 'pi pi-users' },
    i18n: { en: npcEn, fr: npcFr },
    sessionStore: useNpcModuleStore,
    routes: npcRoutes,
  },
  {
    id: 'gameobject',
    basePath: '/gameobject',
    navigation: { id: 'gameobject', icon: 'pi pi-box' },
    i18n: { en: goEn, fr: goFr },
    sessionStore: useGameObjectModuleStore,
    routes: gameObjectRoutes,
  },
  {
    id: 'item',
    basePath: '/item',
    i18n: { en: itemEn, fr: itemFr },
    routes: itemRoutes,
  },
  {
    id: 'quests',
    basePath: '/quests',
    navigation: { id: 'quests', icon: 'pi pi-compass' },
    i18n: { en: questEn, fr: questFr },
    sessionStore: useQuestModuleStore,
    routes: questRoutes,
  },
  {
    id: 'maps',
    basePath: '/maps',
    navigation: { id: 'maps', icon: 'pi pi-map' },
    i18n: { en: mapEn, fr: mapFr },
    sessionStores: [
      useGameTeleStore,
      useExplorationBasexpStore,
      useInstanceStore,
    ],
    routes: mapRoutes,
  },
  {
    id: 'loot-items',
    basePath: '/loot-items',
    navigation: { id: 'loot-items', icon: 'pi pi-box' },
    i18n: { en: lootItemEn, fr: lootItemFr },
    routes: lootAndItemRoutes,
  },
  {
    id: 'spells',
    basePath: '/spells',
    navigation: { id: 'spells', icon: 'pi pi-star' },
    routes: [
      { path: 'spells', name: 'spells', component: () => import('@/pages/PlaceholderModule.vue') },
    ],
  },
  {
    // Shared capability module (no routes / sidebar entry): contributes the
    // model-preview viewer, its settings store/service and i18n.
    id: 'model-viewer',
    basePath: '/model-viewer',
    i18n: { en: modelViewerEn, fr: modelViewerFr },
    routes: [],
  },
  {
    id: 'misc',
    basePath: '/server',
    navigation: { id: 'misc', icon: 'pi pi-server' },
    routes: [
      { path: 'server', name: 'server', component: () => import('@/pages/PlaceholderModule.vue') },
    ],
  },
]

export const moduleRoutes = appModules.flatMap(module => module.routes)

export const moduleNavigationItems = appModules.flatMap<ModuleNavigationItem>(module => (
  module.navigation ? [{ ...module.navigation, path: module.basePath }] : []
))

export const moduleI18nMessages = appModules.flatMap<ModuleI18nMessages>(module => {
  if (!module.i18n) {
    return []
  }

  return [
    { locale: 'fr', messages: module.i18n.fr },
    { locale: 'en', messages: module.i18n.en },
  ]
})

export const sessionModuleStores = appModules.flatMap(module => [
  ...(module.sessionStore ? [module.sessionStore] : []),
  ...(module.sessionStores ?? []),
])