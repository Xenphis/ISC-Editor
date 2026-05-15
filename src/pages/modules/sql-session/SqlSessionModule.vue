<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionChangesStore } from '@/stores/sessionChanges'
import { highlightSql } from '@/utils/sql'
import { copyToClipboard } from '@/utils/clipboard'

const { t } = useI18n()
const session = useSessionChangesStore()

const copiedId = ref<string | null>(null)

async function copyText(text: string, id: string) {
  await copyToClipboard(text)
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}
</script>

<template>
  <div class="sql-session">
    <!-- Header -->
    <div class="session-header">
      <div>
        <h2 class="session-title">{{ t('sqlSession.title') }}</h2>
        <p class="session-description">{{ t('sqlSession.description') }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="session.totalChanges === 0" class="session-empty">
      <i class="pi pi-code" />
      <h3>{{ t('sqlSession.emptyTitle') }}</h3>
      <p>{{ t('sqlSession.emptyDescription') }}</p>
    </div>

    <!-- Query list -->
    <div v-else class="session-content">
      <!-- Summary bar -->
      <div class="session-summary">
        <span class="summary-badge">
          {{ session.totalChanges }} {{ t('sqlSession.entries') }}
        </span>
      </div>

      <!-- Individual queries -->
      <div
        v-for="item in session.allDiffQueries"
        :key="`${item.table}-${item.entry}`"
        class="query-card"
      >
        <div class="query-card-header">
          <div class="query-card-info">
            <span class="query-table">{{ item.table }}</span>
            <span class="query-entry">#{{ item.entry }}</span>
          </div>
          <button class="copy-icon-btn" @click="copyText(item.query, `${item.table}-${item.entry}`)">
            <i :class="copiedId === `${item.table}-${item.entry}` ? 'pi pi-check' : 'pi pi-copy'" />
          </button>
        </div>
        <pre class="query-code" v-html="highlightSql(item.query)" />
      </div>

      <!-- Full script -->
      <div class="full-script-section">
        <div class="full-script-header">
          <div>
            <h3>{{ t('sqlSession.fullScript') }}</h3>
            <p>{{ t('sqlSession.fullScriptDesc') }}</p>
          </div>
          <button class="copy-icon-btn" @click="copyText(session.globalSqlScript, 'full')">
            <i :class="copiedId === 'full' ? 'pi pi-check' : 'pi pi-copy'" />
          </button>
        </div>
        <pre class="full-script-code" v-html="highlightSql(session.globalSqlScript)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sql-session {
  max-width: 80rem;
}

.session-header {
  margin-bottom: 2rem;
}

.copy-icon-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.copy-icon-btn:hover {
  background: rgba(30, 41, 59, 0.5);
  color: #22d3ee;
}

.copy-icon-btn .pi-check {
  color: #4ade80;
}

.session-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.session-description {
  color: #94a3b8;
  font-size: 0.95rem;
  margin: 0;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Empty state */
.session-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 50vh;
  border: 2px dashed rgba(51, 65, 85, 0.5);
  border-radius: 1rem;
  color: #475569;
}

.session-empty .pi-code {
  font-size: 3rem;
  color: #334155;
}

.session-empty h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.session-empty p {
  font-size: 0.9rem;
  margin: 0;
}

/* Summary */
.session-summary {
  margin-bottom: 1.5rem;
}

.summary-badge {
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Query cards */
.query-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.query-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.query-card-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.query-table {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #c084fc;
}

.query-entry {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.query-code {
  margin: 0;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Full script section */
.full-script-section {
  background: rgba(10, 15, 30, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  margin-top: 2rem;
  overflow: hidden;
}

.full-script-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.3);
}

.full-script-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.25rem 0;
}

.full-script-header p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.full-script-code {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
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

/* Scrollbar */
.full-script-code::-webkit-scrollbar {
  width: 6px;
}

.full-script-code::-webkit-scrollbar-track {
  background: transparent;
}

.full-script-code::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.5);
  border-radius: 3px;
}
</style>
