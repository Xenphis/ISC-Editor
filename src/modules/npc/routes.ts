import type { RouteRecordRaw } from 'vue-router'

export const npcRoutes: RouteRecordRaw[] = [
  {
    path: 'npc',
    name: 'npc-hub',
    component: () => import('@/modules/npc/pages/NpcHub.vue'),
  },
  {
    // Single workspace route: no param = list only, 'new' = create mode,
    // otherwise the entry to edit. The component is reused across param
    // changes (list/tabs state survives, dirtyCache handles form state).
    path: 'npc/creature-template/:entry?',
    name: 'npc-creature-template',
    component: () => import('@/modules/npc/pages/CreatureTemplateWorkspace.vue'),
  },
  {
    // Composite key: both params or none.
    path: 'npc/creature-classlevelstats/:level?/:classId?',
    name: 'npc-classlevelstats',
    component: () => import('@/modules/npc/pages/ClassLevelStatsWorkspace.vue'),
  },
  {
    // The formation is keyed by its leader spawn GUID; there is no 'new' mode,
    // creating one starts by picking an existing spawn as leader.
    path: 'npc/formation/:leaderGuid?',
    name: 'npc-formation',
    component: () => import('@/modules/npc/pages/FormationWorkspace.vue'),
  },
  {
    path: 'npc/trainer/:id?',
    name: 'npc-trainer',
    component: () => import('@/modules/npc/pages/TrainerWorkspace.vue'),
  },
]