import type { RouteRecordRaw } from 'vue-router'

export const lootAndItemRoutes: RouteRecordRaw[] = [
  {
    path: 'loot-items',
    name: 'loot-items',
    component: () => import('@/modules/loot_and_item/pages/LootAndItemModule.vue'),
  },
]