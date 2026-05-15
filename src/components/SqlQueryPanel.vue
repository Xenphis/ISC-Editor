<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import type { FieldChange } from '@/composables/useQueryGenerator'
import { highlightSql, formatValue } from '@/utils/sql'
import { copyToClipboard as clipboardCopy } from '@/utils/clipboard'

const { t } = useI18n()

const props = defineProps<{
  diffQuery: string
  fullQuery: string
  hasChanges: boolean
  changedFields: FieldChange[]
}>()

const collapsed = ref(false)
const copied = ref(false)
const activeTab = ref('diff')

const currentQuery = computed(() => {
  if (activeTab.value === 'diff') return props.diffQuery
  if (activeTab.value === 'full') return props.fullQuery
  return ''
})

async function copyToClipboard(text: string) {
  await clipboardCopy(text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="sql-panel" :class="{ collapsed }">
    <!-- Header -->
    <div class="sql-panel-header">
      <div class="sql-panel-title" @click="collapsed = !collapsed">
        <i :class="collapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" />
        <i class="pi pi-code" />
        <span>{{ t('sqlPanel.title') }}</span>
        <span v-if="hasChanges" class="changes-badge">
          {{ changedFields.length }} {{ t('sqlPanel.changes', changedFields.length) }}
        </span>
        <span v-else class="no-changes-badge">
          {{ t('sqlPanel.noChanges') }}
        </span>
      </div>
      <Button
        v-if="currentQuery && !collapsed"
        :icon="copied ? 'pi pi-check' : 'pi pi-copy'"
        :label="copied ? t('sqlPanel.copied') : t('sqlPanel.copy')"
        severity="secondary"
        text
        size="small"
        @click.stop="copyToClipboard(currentQuery)"
      />
    </div>

    <!-- Content -->
    <div v-if="!collapsed" class="sql-panel-content">
      <!-- Custom tab bar -->
      <div class="sql-tab-bar">
        <button
          v-for="tab in ['diff', 'full', 'changes']"
          :key="tab"
          class="sql-tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ tab === 'diff' ? t('sqlPanel.diffQuery') : tab === 'full' ? t('sqlPanel.fullQuery') : t('sqlPanel.changedFields') }}
        </button>
      </div>

      <!-- Diff Query -->
      <div v-if="activeTab === 'diff'" class="sql-tab-content">
        <pre v-if="diffQuery" class="sql-code" v-html="highlightSql(diffQuery)" />
        <div v-else class="sql-empty">
          {{ t('sqlPanel.noChanges') }}
        </div>
      </div>

      <!-- Full Query -->
      <div v-if="activeTab === 'full'" class="sql-tab-content">
        <pre v-if="fullQuery" class="sql-code" v-html="highlightSql(fullQuery)" />
        <div v-else class="sql-empty">
          {{ t('sqlPanel.noData') }}
        </div>
      </div>

      <!-- Changed Fields -->
      <div v-if="activeTab === 'changes'" class="sql-tab-content">
        <div v-if="changedFields.length > 0" class="changes-list">
          <div v-for="change in changedFields" :key="change.field" class="change-item">
            <span class="change-field">{{ change.field }}</span>
            <span class="change-old">{{ formatValue(change.oldValue) }}</span>
            <i class="pi pi-arrow-right change-arrow" />
            <span class="change-new">{{ formatValue(change.newValue) }}</span>
          </div>
        </div>
        <div v-else class="sql-empty">
          {{ t('sqlPanel.noChanges') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sql-panel {
  background: rgba(10, 15, 30, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.sql-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  user-select: none;
}

.sql-panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  flex: 1;
}

.sql-panel-title:hover {
  color: #cbd5e1;
}

.sql-panel-title .pi-code {
  color: #22d3ee;
}

.changes-badge {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-changes-badge {
  color: #475569;
  font-size: 0.75rem;
  font-weight: 400;
}

.sql-panel-content {
  border-top: 1px solid rgba(51, 65, 85, 0.3);
}

/* Custom tab bar */
.sql-tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.sql-tab-btn {
  all: unset;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.sql-tab-btn:hover {
  color: #94a3b8;
  background: rgba(30, 41, 59, 0.3);
}

.sql-tab-btn.active {
  color: #22d3ee;
  border-bottom-color: #22d3ee;
  background: rgba(15, 23, 42, 0.6);
}

/* Tab content */
.sql-tab-content {
  position: relative;
}

.sql-code {
  margin: 0;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.sql-empty {
  padding: 1.5rem;
  text-align: center;
  color: #475569;
  font-size: 0.85rem;
  font-style: italic;
}

/* SQL syntax highlighting */
:deep(.sql-keyword) {
  color: #22d3ee;
  font-weight: 600;
}

:deep(.sql-string) {
  color: #4ade80;
}

:deep(.sql-number) {
  color: #fb923c;
}

:deep(.sql-field) {
  color: #c084fc;
}

/* Changes list */
.changes-list {
  padding: 0.5rem 1rem;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.2);
}

.change-item:last-child {
  border-bottom: none;
}

.change-field {
  color: #c084fc;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  min-width: 10rem;
}

.change-old {
  color: #f87171;
  font-family: 'JetBrains Mono', monospace;
  text-decoration: line-through;
  opacity: 0.7;
}

.change-arrow {
  color: #475569;
  font-size: 0.7rem;
}

.change-new {
  color: #4ade80;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}
</style>
