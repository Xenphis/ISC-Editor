<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import { useDebugStore } from '@/stores/debugStore'

const { t } = useI18n()
const debug = useDebugStore()
const logContainer = ref<HTMLElement | null>(null)

watch(() => debug.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function queryTypeColor(type: string): string {
  switch (type) {
    case 'SELECT': return '#60a5fa'
    case 'INSERT': return '#4ade80'
    case 'REPLACE': return '#a78bfa'
    case 'UPDATE': return '#fbbf24'
    case 'DELETE': return '#f87171'
    default: return '#94a3b8'
  }
}

async function copyAllLogs() {
  const text = debug.logs.map(log =>
    `[${formatTime(log.timestamp)}] ${log.query_type} (${log.execution_time_ms}ms)${log.success ? '' : ' [ERROR]'}: ${log.sql}`
  ).join('\n')

  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy logs:', err)
  }
}

</script>

<template>
  <Dialog
    v-model:visible="debug.viewerVisible"
    :header="t('sqlDebug.title')"
    :modal="false"
    :closable="true"
    :draggable="true"
    :style="{ width: '48rem', maxHeight: '70vh' }"
    position="bottomright"
    :pt="{
      root: { style: 'background: #0f172a; border: 1px solid rgba(51,65,85,0.6); border-radius: 0.75rem; overflow: hidden;' },
      header: { style: 'background: #0f172a; border-bottom: 1px solid rgba(51,65,85,0.4); padding: 0.75rem 1rem; color: #e2e8f0;' },
      content: { style: 'background: #0f172a; padding: 0;' },
      footer: { style: 'background: #0f172a; border-top: 1px solid rgba(51,65,85,0.4); padding: 0.5rem 1rem;' },
      headerActions: { style: 'color: #94a3b8;' },
    }"
  >
    <div ref="logContainer" class="debug-log-container">
      <div v-if="debug.logs.length === 0" class="debug-empty">
        {{ t('sqlDebug.empty') }}
      </div>
      <div
        v-for="log in debug.logs"
        :key="log.id"
        class="debug-log-entry"
        :class="{ 'debug-log-error': !log.success }"
      >
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span
          class="log-type"
          :style="{ color: queryTypeColor(log.query_type) }"
        >{{ log.query_type }}</span>
        <span class="log-duration">{{ log.execution_time_ms }}ms</span>
        <span v-if="!log.success" class="log-error-badge">ERR</span>
        <code class="log-sql">{{ log.sql }}</code>
      </div>
    </div>

    <template #footer>
      <div class="debug-footer">
        <span class="debug-count">{{ debug.logs.length }} {{ t('sqlDebug.entries') }}</span>
        <div class="debug-actions">
          <button
            class="debug-icon-btn debug-copy-btn"
            :title="t('sqlDebug.copy')"
            @click="copyAllLogs"
            :disabled="debug.logs.length === 0"
          >
            <i class="pi pi-copy"></i>
          </button>
          <button
            class="debug-icon-btn debug-clear-btn"
            :title="t('sqlDebug.clear')"
            @click="debug.clearLogs()"
            :disabled="debug.logs.length === 0"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.debug-log-container {
  max-height: 50vh;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.75rem;
}

.debug-log-container::-webkit-scrollbar {
  width: 6px;
}

.debug-log-container::-webkit-scrollbar-track {
  background: transparent;
}

.debug-log-container::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.6);
  border-radius: 3px;
}

.debug-empty {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}

.debug-log-entry {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.2);
  line-height: 1.5;
}

.debug-log-entry:hover {
  background: rgba(51, 65, 85, 0.2);
}

.debug-log-error {
  background: rgba(127, 29, 29, 0.15);
}

.log-time {
  color: #64748b;
  flex-shrink: 0;
  font-size: 0.7rem;
}

.log-type {
  font-weight: 600;
  flex-shrink: 0;
  min-width: 4.5rem;
}

.log-duration {
  color: #94a3b8;
  flex-shrink: 0;
  min-width: 3rem;
  text-align: right;
}

.log-error-badge {
  background: #dc2626;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.log-sql {
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.debug-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.debug-count {
  color: #94a3b8;
  font-size: 0.8rem;
}

.debug-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.debug-icon-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.debug-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.debug-copy-btn:not(:disabled):hover {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.debug-clear-btn:not(:disabled):hover {
  background: rgba(220, 38, 38, 0.15);
  color: #dc2626;
}
</style>
