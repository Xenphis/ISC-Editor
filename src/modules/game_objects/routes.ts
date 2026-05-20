import type { RouteRecordRaw } from 'vue-router'

export const gameObjectRoutes: RouteRecordRaw[] = [
  {
    path: 'gameobject',
    name: 'gameobject-list',
    component: () => import('@/modules/game_objects/pages/GameObjectModule.vue'),
  },
  {
    path: 'gameobject/new',
    name: 'gameobject-new',
    component: () => import('@/modules/game_objects/pages/GameObjectEditor.vue'),
  },
  {
    path: 'gameobject/:entry',
    name: 'gameobject-edit',
    component: () => import('@/modules/game_objects/pages/GameObjectEditor.vue'),
  },
]