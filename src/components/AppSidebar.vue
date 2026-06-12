<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useSessionChangesStore } from '@/stores/sessionChanges'
import { useConnectionStore } from '@/stores/connectionStore'
import { moduleNavigationItems } from '@/modules/registry'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const emit = defineEmits<{
  (e: 'disconnect'): void
}>()

const session = useSessionChangesStore()
const connection = useConnectionStore()
const modules = moduleNavigationItems

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <i class="pi pi-database" style="font-size: 1.5rem; color: white"></i>
      </div>
      <div>
        <h1 class="sidebar-title">{{ t('sidebar.appTitle') }}</h1>
        <p class="sidebar-subtitle">{{ t('sidebar.appSubtitle') }}</p>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <!-- Navigation -->
    <nav class="sidebar-nav">
      <!-- SQL Session -->
      <button
        class="nav-item"
        :class="{ active: isActive('/sql-session') }"
        @click="router.push('/sql-session')"
      >
        <i class="pi pi-code"></i>
        <span>{{ t('sidebar.sql.title') }}</span>
        <span v-if="session.totalChanges > 0" class="nav-badge">{{ session.totalChanges }}</span>
      </button>

      <div class="sidebar-divider nav-divider"></div>

      <button
        v-for="mod in modules"
        :key="mod.id"
        class="nav-item"
        :class="{ active: isActive(mod.path) }"
        @click="router.push(mod.path)"
      >
        <i :class="mod.icon"></i>
        <span>{{ t(`sidebar.modules.${mod.id}`) }}</span>
      </button>
    </nav>

    <!-- Connection Status -->
    <div class="sidebar-divider"></div>

    <div class="sidebar-footer">
      <div class="connection-status">
        <div class="connection-badge">
          <i class="pi pi-check-circle" style="color: #4ade80"></i>
          <span class="connection-label">{{ t('sidebar.connected') }}</span>
        </div>
        <div class="connection-details">
          <p><span class="detail-label">{{ t('sidebar.host') }}</span> {{ connection.connectionInfo.host }}:{{ connection.connectionInfo.port }}</p>
          <p><span class="detail-label">{{ t('sidebar.database') }}</span> {{ connection.connectionInfo.database }}</p>
          <p><span class="detail-label">{{ t('sidebar.user') }}</span> {{ connection.connectionInfo.username }}</p>
        </div>
      </div>

      <Button
        :label="t('sidebar.disconnect')"
        icon="pi pi-sign-out"
        severity="secondary"
        class="disconnect-btn"
        fluid
        @click="emit('disconnect')"
      />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 13rem;
  flex-shrink: 0;
  height: 100vh;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(51, 65, 85, 0.5);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.sidebar-logo {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  line-height: 1.2;
}

.sidebar-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
}

.sidebar-divider {
  height: 1px;
  background: rgba(51, 65, 85, 0.5);
  margin-bottom: 1rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: none;
  background: none;
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.nav-item:hover {
  background: rgba(30, 41, 59, 0.5);
  color: white;
}

.nav-item.active {
  background: linear-gradient(to right, #2563eb, #06b6d4);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.nav-item i {
  font-size: 1.1rem;
  width: 1.25rem;
  text-align: center;
}

.nav-badge {
  margin-left: auto;
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  padding: 0.1rem 0.45rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 1.2rem;
  text-align: center;
}

.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-divider {
  margin: 0.25rem 0 0.25rem 0;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
  padding: 0 0.25rem 0.25rem;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.connection-status {
  padding: 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.connection-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #4ade80;
}

.connection-details p {
  font-size: 0.75rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.detail-label {
  color: #64748b;
}

.disconnect-btn {
  background: rgba(30, 41, 59, 0.5) !important;
  border: 1px solid rgba(51, 65, 85, 0.5) !important;
  color: #cbd5e1 !important;
}

.disconnect-btn:hover {
  background: rgba(127, 29, 29, 0.2) !important;
  border-color: rgba(185, 28, 28, 0.5) !important;
  color: #f87171 !important;
}
</style>
