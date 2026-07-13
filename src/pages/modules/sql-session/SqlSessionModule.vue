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
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.copy-icon-btn:hover {
  background: var(--surface-elevated);
  color: var(--accent);
}

.copy-icon-btn .pi-check {
  color: var(--success);
}

.session-title {
  font-size: 2rem;
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
}

.session-description {
  color: var(--text-muted);
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
  border: 2px dashed var(--border-input-soft);
  border-radius: 1rem;
  color: var(--text-placeholder);
}

.session-empty .pi-code {
  font-size: 3rem;
  color: var(--border-input);
}

.session-empty h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-muted);
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
  background: var(--accent-ring-soft);
  color: var(--accent);
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Query cards */
.query-card {
  background: var(--surface-1);
  border: 1px solid var(--border-default);
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  overflow: hidden;
}

.query-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-default);
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
  color: var(--sql-field);
}

.query-entry {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.query-code {
  margin: 0;
  padding: 0.75rem 1rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}

/* Full script section */
.full-script-section {
  background: var(--surface-code);
  border: 1px solid var(--border-default);
  border-radius: 0.75rem;
  margin-top: 2rem;
  overflow: hidden;
}

.full-script-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-default);
}

.full-script-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.25rem 0;
}

.full-script-header p {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.full-script-code {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

/* SQL syntax highlighting */
:deep(.sql-keyword) {
  color: var(--accent);
  font-weight: 600;
}

:deep(.sql-string) {
  color: var(--success);
}

:deep(.sql-number) {
  color: var(--warn);
}

:deep(.sql-field) {
  color: var(--sql-field);
}

/* Scrollbar */
.full-script-code::-webkit-scrollbar {
  width: 6px;
}

.full-script-code::-webkit-scrollbar-track {
  background: transparent;
}

.full-script-code::-webkit-scrollbar-thumb {
  background: var(--border-input-soft);
  border-radius: 3px;
}
</style>
