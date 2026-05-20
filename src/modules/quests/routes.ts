import type { RouteRecordRaw } from 'vue-router'

export const questRoutes: RouteRecordRaw[] = [
  {
    path: 'quests',
    name: 'quests-list',
    component: () => import('@/modules/quests/pages/QuestModule.vue'),
  },
  {
    path: 'quests/new',
    name: 'quests-new',
    component: () => import('@/modules/quests/pages/QuestEditor.vue'),
  },
  {
    path: 'quests/:id',
    name: 'quests-edit',
    component: () => import('@/modules/quests/pages/QuestEditor.vue'),
  },
]