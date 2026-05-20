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
]