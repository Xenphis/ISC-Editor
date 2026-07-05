<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { SmartScript } from '../types'
import { getActionDef, getEventDef, getTargetDef } from '../defs'
import { summarizeRow } from '../summarize'

const { t } = useI18n()

defineProps<{
  rows: SmartScript[]
  selectedRow: SmartScript | null
}>()

const emit = defineEmits<{
  (e: 'select', row: SmartScript): void
}>()

function typeLabel(kind: 'event' | 'action' | 'target', row: SmartScript): string {
  switch (kind) {
    case 'event': return `${row.event_type} — ${getEventDef(row.event_type).name.replace('SMART_EVENT_', '')}`
    case 'action': return `${row.action_type} — ${getActionDef(row.action_type).name.replace('SMART_ACTION_', '')}`
    case 'target': return `${row.target_type} — ${getTargetDef(row.target_type).name.replace('SMART_TARGET_', '')}`
  }
}
</script>

<template>
  <DataTable
    :value="rows"
    size="small"
    scrollable
    :rowClass="(r: SmartScript) => r === selectedRow ? 'sai-table-selected' : ''"
    class="sai-table"
    @row-click="(e: any) => emit('select', e.data)"
  >
    <Column field="entryorguid" header="Entry/GUID" :style="{ width: '7rem' }" />
    <Column field="source_type" header="Src" :style="{ width: '3.5rem' }" />
    <Column field="id" header="ID" :style="{ width: '3.5rem' }" />
    <Column field="link" header="Link" :style="{ width: '3.8rem' }" />
    <Column header="Event">
      <template #body="{ data }">
        <span v-tooltip.top="summarizeRow(data).event">{{ typeLabel('event', data) }}</span>
      </template>
    </Column>
    <Column header="Phase" :style="{ width: '4.5rem' }">
      <template #body="{ data }">{{ data.event_phase_mask }}</template>
    </Column>
    <Column header="%" :style="{ width: '3.5rem' }">
      <template #body="{ data }">{{ data.event_chance }}</template>
    </Column>
    <Column header="Action">
      <template #body="{ data }">
        <span v-tooltip.top="summarizeRow(data).action">{{ typeLabel('action', data) }}</span>
      </template>
    </Column>
    <Column header="Target">
      <template #body="{ data }">
        <span v-tooltip.top="summarizeRow(data).target">{{ typeLabel('target', data) }}</span>
      </template>
    </Column>
    <Column field="comment" :header="t('creature_template.smart_ai.fields.comment')" />
    <template #empty>
      <span class="sai-table-empty">{{ t('creature_template.smart_ai.emptyGroup') }}</span>
    </template>
  </DataTable>
</template>

<style scoped>
.sai-table {
  font-size: 0.82rem;
}

.sai-table :deep(tr) {
  cursor: pointer;
}

.sai-table :deep(.sai-table-selected) {
  background: rgba(6, 182, 212, 0.1) !important;
}

.sai-table-empty {
  color: #64748b;
  font-style: italic;
}
</style>
