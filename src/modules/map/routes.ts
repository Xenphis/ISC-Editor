import type { RouteRecordRaw } from 'vue-router'

// Each sub-table uses a single workspace route: no param = list only,
// 'new' = create mode, otherwise the key of the row to edit.
export const mapRoutes: RouteRecordRaw[] = [
  {
    path: 'maps',
    name: 'maps-hub',
    component: () => import('@/modules/map/pages/MapModule.vue'),
  },
  {
    // Composite key: both params, or mapId = 'new', or none.
    path: 'maps/access-requirement/:mapId?/:difficulty?',
    name: 'maps-access-requirement',
    component: () => import('@/modules/map/pages/AccessRequirementWorkspace.vue'),
  },
  {
    path: 'maps/teleport/:id?',
    name: 'maps-teleport',
    component: () => import('@/modules/map/pages/GameTeleWorkspace.vue'),
  },
  {
    path: 'maps/exploration/:level?',
    name: 'maps-exploration',
    component: () => import('@/modules/map/pages/ExplorationBasexpWorkspace.vue'),
  },
  {
    path: 'maps/instances/:map?',
    name: 'maps-instances',
    component: () => import('@/modules/map/pages/InstanceWorkspace.vue'),
  },
]
