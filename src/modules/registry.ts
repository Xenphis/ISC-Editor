import type { RouteRecordRaw } from 'vue-router'
import { npcRoutes } from '@/modules/npc/routes'
import { gameObjectRoutes } from '@/modules/game_objects/routes'
import { itemRoutes } from '@/modules/item/routes'
import { questRoutes } from '@/modules/quests/routes'
import { mapRoutes } from '@/modules/map/routes'
import { lootAndItemRoutes } from '@/modules/loot_and_item/routes'
import { mapViewerRoutes } from '@/modules/map_viewer/routes'
import { mapEditorRoutes } from '@/modules/map_editor/routes'
import { modelSearchRoutes } from '@/modules/model_search/routes'
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
import mapViewerFr from '@/modules/map_viewer/i18n/fr.json'
import mapViewerEn from '@/modules/map_viewer/i18n/en.json'
import mapEditorFr from '@/modules/map_editor/i18n/fr.json'
import mapEditorEn from '@/modules/map_editor/i18n/en.json'
import modelSearchFr from '@/modules/model_search/i18n/fr.json'
import modelSearchEn from '@/modules/model_search/i18n/en.json'

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
    routes: npcRoutes,
  },
  {
    id: 'gameobject',
    basePath: '/gameobject',
    navigation: { id: 'gameobject', icon: 'pi pi-box' },
    i18n: { en: goEn, fr: goFr },
    routes: gameObjectRoutes,
  },
  {
    // Tag-based model finder for NPCs / GameObjects. Read-only: it searches the
    // creature_model_tags / gameobject_model_tags tables (filled manually via
    // SQL). Also embedded as a picker dialog in the NPC & GameObject editors.
    // Reached via the "Misc" hub card, not its own navbar entry.
    id: 'model-search',
    basePath: '/model-search',
    i18n: { en: modelSearchEn, fr: modelSearchFr },
    routes: modelSearchRoutes,
  },
  {
    // Reached via the "Loot & Items" hub's Items card, not its own navbar
    // entry — avoids a redundant top-level icon next to "loot-items".
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
    routes: questRoutes,
  },
  {
    id: 'maps',
    basePath: '/maps',
    navigation: { id: 'maps', icon: 'pi pi-map' },
    i18n: { en: mapEn, fr: mapFr },
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
    // World map browser rendered from the local client's minimap data.
    // Reached via the "Maps" hub's Map Editor card, not its own navbar
    // entry — avoids a redundant top-level icon next to "maps".
    id: 'map-editor',
    basePath: '/map-editor',
    i18n: { en: mapEditorEn, fr: mapEditorFr },
    routes: mapEditorRoutes,
  },
  {
    // Shared capability module: zone-map spawn viewer. Its only route is the
    // calibration debug tool (#/map-viewer/calibrate), not in the sidebar.
    id: 'map-viewer',
    basePath: '/map-viewer',
    i18n: { en: mapViewerEn, fr: mapViewerFr },
    routes: mapViewerRoutes,
  },
  {
    id: 'misc',
    basePath: '/server',
    navigation: { id: 'misc', icon: 'pi pi-server' },
    routes: [
      { path: 'server', name: 'server', component: () => import('@/modules/misc_hub/MiscHub.vue') },
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