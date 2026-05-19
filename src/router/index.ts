import { createRouter, createWebHashHistory } from 'vue-router'
import { useConnectionStore } from '@/stores/connectionStore'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/npc' },
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
          path: 'sql-session',
          name: 'sql-session',
          component: () => import('@/pages/modules/sql-session/SqlSessionModule.vue'),
        },
        // Placeholder routes for future modules
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
        { path: 'maps', name: 'maps', component: () => import('@/modules/map/pages/MapModule.vue') },
        { path: 'maps/access-requirement', name: 'access-requirement-list', component: () => import('@/modules/map/pages/AccessRequirementModule.vue') },
        { path: 'maps/access-requirement/new', name: 'access-requirement-new', component: () => import('@/modules/map/pages/editor/AccessRequirementEditor.vue') },
        { path: 'maps/access-requirement/:mapId/:difficulty', name: 'access-requirement-edit', component: () => import('@/modules/map/pages/editor/AccessRequirementEditor.vue') },
        { path: 'loot-items', name: 'loot-items', component: () => import('@/modules/loot_and_item/pages/LootAndItemModule.vue') },
        { path: 'spells', name: 'spells', component: () => import('@/pages/PlaceholderModule.vue') },
        { path: 'server', name: 'server', component: () => import('@/pages/PlaceholderModule.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const connection = useConnectionStore()

  if (to.meta.requiresAuth !== false && !connection.isConnected) {
    return { name: 'login' }
  }

  if (to.name === 'login' && connection.isConnected) {
    return { path: '/npc' }
  }
})

export default router
