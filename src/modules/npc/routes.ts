import type { RouteRecordRaw } from 'vue-router'

export const npcRoutes: RouteRecordRaw[] = [
  {
    path: 'npc',
    name: 'npc-hub',
    component: () => import('@/modules/npc/pages/NpcHub.vue'),
  },
  {
    path: 'npc/creature-template',
    name: 'npc-list',
    component: () => import('@/modules/npc/pages/NpcModule.vue'),
  },
  {
    path: 'npc/creature-template/new',
    name: 'npc-new',
    component: () => import('@/modules/npc/pages/CreatureTemplateEditor.vue'),
  },
  {
    path: 'npc/creature-template/:entry',
    name: 'npc-edit',
    component: () => import('@/modules/npc/pages/CreatureTemplateEditor.vue'),
  },
  {
    path: 'npc/creature-classlevelstats',
    name: 'creature-classlevelstats-list',
    component: () => import('@/modules/npc/pages/CreatureClassLevelStatsModule.vue'),
  },
  {
    path: 'npc/trainer',
    name: 'trainer-list',
    component: () => import('@/modules/npc/pages/TrainerModule.vue'),
  },
  {
    path: 'npc/trainer/new',
    name: 'trainer-new',
    component: () => import('@/modules/npc/pages/TrainerEditor.vue'),
  },
  {
    path: 'npc/trainer/:id',
    name: 'trainer-edit',
    component: () => import('@/modules/npc/pages/TrainerEditor.vue'),
  },
  {
    path: 'npc/creature-classlevelstats/:level/:classId',
    name: 'creature-classlevelstats-edit',
    component: () => import('@/modules/npc/pages/editor/class_level_stats/ClassLevelStatsEditor.vue'),
  },
]