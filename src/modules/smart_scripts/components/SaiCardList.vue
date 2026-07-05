<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import SaiCard from './SaiCard.vue'
import type { SaiCardNode, SaiScriptGroup } from '../viewModel'
import type { SmartScript } from '../types'
import { SAI_SOURCE_TYPE_TIMED_ACTIONLIST } from '../types'

const { t } = useI18n()

const props = defineProps<{
  groups: SaiScriptGroup[]
  selectedRow: SmartScript | null
  entry: number
  /** Phase filter: empty = show all */
  phaseFilter: number[]
  /** "only if …" summary for a row's conditions ('' when none) */
  conditionsFor: (row: SmartScript) => string
}>()

const emit = defineEmits<{
  (e: 'select', row: SmartScript): void
  (e: 'remove', node: SaiCardNode): void
  (e: 'move', node: SaiCardNode, direction: -1 | 1): void
  (e: 'add-link', node: SaiCardNode): void
  (e: 'add-row', group: SaiScriptGroup): void
  (e: 'open-actionlist', id: number): void
}>()

function groupTitle(group: SaiScriptGroup): string {
  if (group.sourceType === SAI_SOURCE_TYPE_TIMED_ACTIONLIST) {
    return t('creature_template.smart_ai.groupActionlist', { id: group.entryorguid })
  }
  if (group.entryorguid < 0) {
    return t('creature_template.smart_ai.groupGuid', { guid: -group.entryorguid })
  }
  return t('creature_template.smart_ai.groupEntry', { entry: group.entryorguid })
}

function matchesPhaseFilter(node: SaiCardNode): boolean {
  if (props.phaseFilter.length === 0) return true
  const mask = node.row.event_phase_mask
  if (mask === 0) return true
  return props.phaseFilter.some(bit => (mask & bit) !== 0)
}

const visibleGroups = computed(() =>
  props.groups.map(group => ({
    group,
    nodes: group.nodes.filter(matchesPhaseFilter),
  })))
</script>

<template>
  <div class="sai-group-list">
    <section v-for="{ group, nodes } in visibleGroups" :key="`${group.entryorguid}:${group.sourceType}`" class="sai-group">
      <div class="sai-group-header">
        <h4 :class="{ 'sai-group-actionlist': group.sourceType === SAI_SOURCE_TYPE_TIMED_ACTIONLIST }">
          {{ groupTitle(group) }}
          <span class="sai-group-count">({{ group.nodes.length }})</span>
        </h4>
        <span v-if="group.hasCycle" class="sai-group-warning">
          <i class="pi pi-exclamation-triangle" />
          {{ t('creature_template.smart_ai.linkCycle') }}
        </span>
        <Button
          icon="pi pi-plus"
          size="small"
          text
          :label="t('creature_template.smart_ai.addRow')"
          @click="emit('add-row', group)"
        />
      </div>

      <div v-if="nodes.length === 0" class="sai-group-empty">
        {{ t('creature_template.smart_ai.emptyGroup') }}
      </div>

      <SaiCard
        v-for="(node, index) in nodes"
        :key="node.row.id"
        :node="node"
        :selectedRow="selectedRow"
        :canMoveUp="index > 0"
        :canMoveDown="index < nodes.length - 1"
        :conditionsFor="conditionsFor"
        @select="(r) => emit('select', r)"
        @remove="(n) => emit('remove', n)"
        @move="(n, d) => emit('move', n, d)"
        @add-link="(n) => emit('add-link', n)"
        @open-actionlist="(id) => emit('open-actionlist', id)"
      />
    </section>
  </div>
</template>

<style scoped>
.sai-group-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sai-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sai-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sai-group-header h4 {
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.sai-group-actionlist {
  color: #fbbf24 !important;
}

.sai-group-count {
  color: #64748b;
  font-weight: 400;
}

.sai-group-warning {
  color: #fbbf24;
  font-size: 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.sai-group-empty {
  color: #64748b;
  font-size: 0.82rem;
  font-style: italic;
  padding: 0.75rem;
  border: 1px dashed rgba(51, 65, 85, 0.6);
  border-radius: 8px;
}
</style>
