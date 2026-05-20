import type { RouteRecordRaw } from 'vue-router'

export const itemRoutes: RouteRecordRaw[] = [
  {
    path: 'item',
    name: 'item-list',
    component: () => import('@/modules/item/pages/ItemModule.vue'),
  },
  {
    path: 'item/new',
    name: 'item-new',
    component: () => import('@/modules/item/pages/ItemEditor.vue'),
  },
  {
    path: 'item/:entry',
    name: 'item-edit',
    component: () => import('@/modules/item/pages/ItemEditor.vue'),
  },
]