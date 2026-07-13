import type { RouteRecordRaw } from 'vue-router'

export const gameObjectRoutes: RouteRecordRaw[] = [
  {
    // Single workspace route: no param = list only, 'new' = create mode,
    // otherwise the entry to edit.
    path: 'gameobject/:entry?',
    name: 'gameobject',
    component: () => import('@/modules/game_objects/pages/GameObjectWorkspace.vue'),
  },
]
