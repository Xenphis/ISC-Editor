<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import SqlDebugViewer from '@/components/SqlDebugViewer.vue'
import { useConnectionStore } from '@/stores/connectionStore'
import { useDebugStore } from '@/stores/debugStore'
import { useRouter } from 'vue-router'

const connection = useConnectionStore()
const debug = useDebugStore()
const router = useRouter()

async function handleDisconnect() {
  await connection.disconnect()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <AppSidebar
      @disconnect="handleDisconnect"
    />

    <main class="main-content">
      <router-view />
    </main>

    <!-- SQL Debug FAB -->
    <button
      v-if="debug.enabled"
      class="debug-fab"
      :title="$t('sqlDebug.openViewer')"
      @click="debug.viewerVisible = true"
    >
      <i class="pi pi-database"></i>
      <span v-if="debug.logs.length" class="debug-fab-badge">{{ debug.logs.length }}</span>
    </button>

    <SqlDebugViewer />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 1.5rem;
  overflow-y: auto;
  height: 100vh;
}

.debug-fab {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
  transition: all 0.2s;
  z-index: 1000;
}

.debug-fab:hover {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
  transform: scale(1.05);
}

.debug-fab-badge {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background: #dc2626;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
}
</style>
