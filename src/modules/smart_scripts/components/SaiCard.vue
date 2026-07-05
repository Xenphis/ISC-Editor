<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import type { SaiCardNode } from '../viewModel'
import type { SmartScript } from '../types'
import {
  SAI_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST,
  SAI_ACTION_CALL_RANDOM_TIMED_ACTIONLIST,
  SAI_ACTION_CALL_TIMED_ACTIONLIST,
  SAI_ACTION_INC_EVENT_PHASE,
  SAI_ACTION_SET_EVENT_PHASE,
} from '../types'
import { summarizeAction, summarizeEvent, summarizeTarget } from '../summarize'
import { event_flags_options } from '../defs'

const props = defineProps<{
  node: SaiCardNode
  selectedRow: SmartScript | null
  /** Nested rendering for linked children */
  depth?: number
  canMoveUp?: boolean
  canMoveDown?: boolean
  conditionsFor?: (row: SmartScript) => string
}>()

const emit = defineEmits<{
  (e: 'select', row: SmartScript): void
  (e: 'remove', node: SaiCardNode): void
  (e: 'move', node: SaiCardNode, direction: -1 | 1): void
  (e: 'add-link', node: SaiCardNode): void
  (e: 'open-actionlist', id: number): void
}>()

const row = computed(() => props.node.row)
const isSelected = computed(() => props.selectedRow === props.node.row)

const phases = computed(() => {
  const mask = row.value.event_phase_mask
  if (mask === 0) return []
  const list: string[] = []
  for (let i = 0; i < 12; i++) {
    if (mask & (1 << i)) list.push(`P${i + 1}`)
  }
  return list
})

const flagNames = computed(() =>
  event_flags_options.filter(o => (row.value.event_flags & o.value) !== 0).map(o => o.name).join(', '))

const isPhaseChange = computed(() =>
  row.value.action_type === SAI_ACTION_SET_EVENT_PHASE || row.value.action_type === SAI_ACTION_INC_EVENT_PHASE)

const actionlistLink = computed(() => {
  if (row.value.action_type === SAI_ACTION_CALL_TIMED_ACTIONLIST && row.value.action_param1 > 0) {
    return row.value.action_param1
  }
  if ((row.value.action_type === SAI_ACTION_CALL_RANDOM_TIMED_ACTIONLIST
    || row.value.action_type === SAI_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST)
    && row.value.action_param1 > 0) {
    return row.value.action_param1
  }
  return 0
})

const conditionsSummary = computed(() => props.conditionsFor?.(row.value) ?? '')
</script>

<template>
  <div class="sai-card-wrapper" :style="{ marginLeft: `${(depth ?? 0) * 1.75}rem` }">
    <div
      class="sai-card"
      :class="{ 'sai-card-selected': isSelected, 'sai-card-warning': node.orphan || node.linkedNonLinkEvent }"
      @click="emit('select', node.row)"
    >
      <span class="sai-card-id">#{{ row.id }}</span>

      <span v-if="depth" class="sai-card-then">then</span>

      <span class="sai-card-sentence">
        <template v-if="!depth">
          <span class="sai-segment sai-segment-event">{{ summarizeEvent(row) }}</span>
          <i class="pi pi-arrow-right sai-arrow" />
        </template>
        <span class="sai-segment sai-segment-action">{{ summarizeAction(row) }}</span>
        <i class="pi pi-arrow-right sai-arrow" />
        <span class="sai-segment sai-segment-target">{{ summarizeTarget(row) }}</span>
      </span>

      <span class="sai-card-badges">
        <span v-for="phase in phases" :key="phase" class="sai-badge sai-badge-phase">{{ phase }}</span>
        <span v-if="row.event_chance < 100" class="sai-badge sai-badge-chance">{{ row.event_chance }}%</span>
        <i v-if="row.event_flags !== 0" class="pi pi-flag sai-badge-icon" v-tooltip.top="flagNames" />
        <span v-if="isPhaseChange" class="sai-badge sai-badge-phasechange" v-tooltip.top="'Changes the event phase'">
          <i class="pi pi-sync" />
        </span>
        <i v-if="node.orphan" class="pi pi-exclamation-triangle sai-badge-icon sai-badge-warn"
           v-tooltip.top="'Linked-event row that no other row links to'" />
        <i v-if="node.linkedNonLinkEvent" class="pi pi-exclamation-triangle sai-badge-icon sai-badge-warn"
           v-tooltip.top="'Linked row with a real event: it also fires on its own'" />
        <Button
          v-if="actionlistLink > 0"
          class="sai-badge-actionlist"
          size="small"
          text
          :label="`↳ ${actionlistLink}`"
          v-tooltip.top="'Open the timed actionlist'"
          @click.stop="emit('open-actionlist', actionlistLink)"
        />
      </span>

      <span v-if="conditionsSummary" class="sai-card-conditions" v-tooltip.top="conditionsSummary">
        <i class="pi pi-filter" />
      </span>

      <span class="sai-card-actions" @click.stop>
        <Button icon="pi pi-chevron-up" text size="small" :disabled="!canMoveUp" @click="emit('move', node, -1)" />
        <Button icon="pi pi-chevron-down" text size="small" :disabled="!canMoveDown" @click="emit('move', node, 1)" />
        <Button v-if="!depth" icon="pi pi-link" text size="small"
                v-tooltip.top="'Add a linked action (then…)'" @click="emit('add-link', node)" />
        <Button icon="pi pi-trash" text size="small" severity="danger" @click="emit('remove', node)" />
      </span>
    </div>

    <div v-if="conditionsSummary" class="sai-card-conditions-line" :style="{ marginLeft: '2.6rem' }">
      {{ conditionsSummary }}
    </div>

    <SaiCard
      v-for="(child, index) in node.children"
      :key="child.row.id"
      :node="child"
      :selectedRow="selectedRow"
      :depth="(depth ?? 0) + 1"
      :canMoveUp="index > 0"
      :canMoveDown="index < node.children.length - 1"
      :conditionsFor="conditionsFor"
      @select="(r) => emit('select', r)"
      @remove="(n) => emit('remove', n)"
      @move="(n, d) => emit('move', n, d)"
      @add-link="(n) => emit('add-link', n)"
      @open-actionlist="(id) => emit('open-actionlist', id)"
    />
  </div>
</template>

<style scoped>
.sai-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sai-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.55);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.65);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.sai-card:hover {
  border-color: rgba(6, 182, 212, 0.45);
  background: rgba(15, 23, 42, 0.85);
}

.sai-card-selected {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
}

.sai-card-warning {
  border-left: 3px solid #fbbf24;
}

.sai-card-id {
  color: #64748b;
  font-size: 0.72rem;
  font-family: monospace;
  min-width: 2rem;
}

.sai-card-then {
  color: #94a3b8;
  font-size: 0.78rem;
  font-style: italic;
}

.sai-card-sentence {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.sai-arrow {
  font-size: 0.65rem;
  color: #475569;
}

.sai-segment {
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  white-space: nowrap;
}

.sai-segment-event {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
}

.sai-segment-action {
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
}

.sai-segment-target {
  background: rgba(168, 85, 247, 0.12);
  color: #d8b4fe;
}

.sai-card-badges {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.sai-badge {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.sai-badge-phase {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
}

.sai-badge-chance {
  background: rgba(244, 114, 182, 0.15);
  color: #f9a8d4;
}

.sai-badge-phasechange {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
}

.sai-badge-icon {
  font-size: 0.75rem;
  color: #94a3b8;
}

.sai-badge-warn {
  color: #fbbf24;
}

.sai-badge-actionlist {
  padding: 0 0.3rem !important;
  font-size: 0.72rem !important;
}

.sai-card-conditions {
  color: #f9a8d4;
  font-size: 0.75rem;
}

.sai-card-conditions-line {
  color: #f9a8d4;
  font-size: 0.75rem;
  font-style: italic;
}

.sai-card-actions {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  opacity: 0.35;
  transition: opacity 0.15s;
}

.sai-card:hover .sai-card-actions {
  opacity: 1;
}
</style>
