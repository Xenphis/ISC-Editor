import { createRouter, createWebHashHistory } from 'vue-router'
import { useConnectionStore } from '@/stores/connectionStore'
import { moduleRoutes, sqlSessionRoute } from '@/modules/registry'

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
        sqlSessionRoute,
        ...moduleRoutes,
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
