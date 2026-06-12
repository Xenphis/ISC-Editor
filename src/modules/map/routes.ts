import type { RouteRecordRaw } from 'vue-router'

export const mapRoutes: RouteRecordRaw[] = [
  {
    path: 'maps',
    name: 'maps',
    component: () => import('@/modules/map/pages/MapModule.vue'),
  },
  {
    path: 'maps/access-requirement',
    name: 'access-requirement-list',
    component: () => import('@/modules/map/pages/AccessRequirementModule.vue'),
  },
  {
    path: 'maps/access-requirement/new',
    name: 'access-requirement-new',
    component: () => import('@/modules/map/pages/editor/AccessRequirementEditor.vue'),
  },
  {
    path: 'maps/access-requirement/:mapId/:difficulty',
    name: 'access-requirement-edit',
    component: () => import('@/modules/map/pages/editor/AccessRequirementEditor.vue'),
  },

  // ─── game_tele (Teleportation) ─────────────────────────────────────
  {
    path: 'maps/teleport',
    name: 'game-tele-list',
    component: () => import('@/modules/map/pages/GameTeleModule.vue'),
  },
  {
    path: 'maps/teleport/new',
    name: 'game-tele-new',
    component: () => import('@/modules/map/pages/editor/GameTeleEditor.vue'),
  },
  {
    path: 'maps/teleport/:id',
    name: 'game-tele-edit',
    component: () => import('@/modules/map/pages/editor/GameTeleEditor.vue'),
  },

  // ─── exploration_basexp (Exploration XP) ───────────────────────────
  {
    path: 'maps/exploration',
    name: 'exploration-list',
    component: () => import('@/modules/map/pages/ExplorationBasexpModule.vue'),
  },
  {
    path: 'maps/exploration/new',
    name: 'exploration-new',
    component: () => import('@/modules/map/pages/editor/ExplorationBasexpEditor.vue'),
  },
  {
    path: 'maps/exploration/:level',
    name: 'exploration-edit',
    component: () => import('@/modules/map/pages/editor/ExplorationBasexpEditor.vue'),
  },

  // ─── Instances (list + tabbed editor) ──────────────────────────────
  {
    path: 'maps/instances',
    name: 'instance-list',
    component: () => import('@/modules/map/pages/InstanceModule.vue'),
  },
  {
    path: 'maps/instances/new',
    name: 'instance-new',
    component: () => import('@/modules/map/pages/editor/InstanceEditor.vue'),
  },
  {
    path: 'maps/instances/:map',
    name: 'instance-edit',
    component: () => import('@/modules/map/pages/editor/InstanceEditor.vue'),
  },
]