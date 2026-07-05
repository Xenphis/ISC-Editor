<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import MultiSelect from 'primevue/multiselect'
import SelectButton from 'primevue/selectbutton'
import SaiCardList from './SaiCardList.vue'
import SaiTableView from './SaiTableView.vue'
import SaiEditPanel from './SaiEditPanel.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import * as saiService from '../service'
import type { SmartScript } from '../types'
import {
  SAI_EVENT_LINK,
  SAI_SOURCE_TYPE_CREATURE,
  SAI_SOURCE_TYPE_TIMED_ACTIONLIST,
} from '../types'
import { buildScriptGroups, flattenGroup, type SaiCardNode, type SaiScriptGroup } from '../viewModel'
import { buildComment, summarizeConditionGroups } from '../summarize'

const { t } = useI18n()
const store = useNpcModuleStore()
const manager = store.smartScripts

const props = defineProps<{
  ownerName: string
}>()

const rows = computed(() => manager.getNewEntries())
const groups = computed(() => buildScriptGroups(rows.value))

const viewMode = ref<'cards' | 'table'>('cards')
const viewOptions = computed(() => [
  { label: t('creature_template.smart_ai.viewCards'), value: 'cards' },
  { label: t('creature_template.smart_ai.viewTable'), value: 'table' },
])

const phaseFilter = ref<number[]>([])
const phaseFilterOptions = Array.from({ length: 12 }, (_, i) => ({
  label: `Phase ${i + 1}`,
  value: 1 << i,
}))

const selectedRow = ref<SmartScript | null>(null)
const drawerVisible = ref(false)

const selectedIsLinked = computed(() => selectedRow.value?.event_type === SAI_EVENT_LINK)

function select(row: SmartScript) {
  selectedRow.value = row
  drawerVisible.value = true
}

function ensureSmartAiName() {
  if (store.formData.AIName !== 'SmartAI') {
    store.formData.AIName = 'SmartAI'
  }
}

function createRow(entryorguid: number, sourceType: number): SmartScript {
  const row: SmartScript = {
    entryorguid,
    source_type: sourceType,
    id: 0,
    link: 0,
    event_type: sourceType === SAI_SOURCE_TYPE_TIMED_ACTIONLIST ? 0 : 1,
    event_phase_mask: 0,
    event_chance: 100,
    event_flags: 0,
    event_param1: 0,
    event_param2: 0,
    event_param3: 0,
    event_param4: 0,
    action_type: 1,
    action_param1: 0,
    action_param2: 0,
    action_param3: 0,
    action_param4: 0,
    action_param5: 0,
    action_param6: 0,
    target_type: 1,
    target_param1: 0,
    target_param2: 0,
    target_param3: 0,
    target_x: 0,
    target_y: 0,
    target_z: 0,
    target_o: 0,
    comment: '',
  }
  row.comment = buildComment(props.ownerName, row)
  return row
}

/** Conditions summary shown on cards ("only if …"). */
function conditionsFor(row: SmartScript): string {
  return summarizeConditionGroups(store.saiConditions.getForRow(row))
}

/**
 * Rebuild the flat entry array from a (possibly mutated) card tree and
 * re-point the conditions of renumbered rows (SourceGroup = id + 1).
 */
function applyTree(tree: SaiScriptGroup[]) {
  const oldIds = new Map<SmartScript, number>(rows.value.map(r => [r, r.id]))
  const flat: SmartScript[] = []
  for (const group of tree) {
    flat.push(...flattenGroup(group))
  }
  const mapping = new Map<string, number>()
  for (const row of flat) {
    const oldId = oldIds.get(row)
    if (oldId !== undefined) {
      mapping.set(`${row.entryorguid}:${row.source_type}:${oldId}`, row.id)
    }
  }
  store.saiConditions.remapGroups(mapping)
  manager.setNewEntries(flat)
}

function findNode(tree: SaiScriptGroup[], row: SmartScript): { list: SaiCardNode[], index: number, group: SaiScriptGroup } | null {
  for (const group of tree) {
    for (let i = 0; i < group.nodes.length; i++) {
      const node = group.nodes[i]
      if (!node) continue
      if (node.row === row) return { list: group.nodes, index: i, group }
      for (let j = 0; j < node.children.length; j++) {
        if (node.children[j]?.row === row) return { list: node.children, index: j, group }
      }
    }
  }
  return null
}

function addRow(group: SaiScriptGroup) {
  const tree = buildScriptGroups(rows.value)
  const target = tree.find(g => g.entryorguid === group.entryorguid && g.sourceType === group.sourceType)
  if (!target) return
  const row = createRow(group.entryorguid, group.sourceType)
  target.nodes.push({ row, children: [] })
  if (group.sourceType === SAI_SOURCE_TYPE_CREATURE) ensureSmartAiName()
  applyTree(tree)
  select(row)
}

function addFirstRow() {
  const entry = store.formData.entry
  const row = createRow(entry, SAI_SOURCE_TYPE_CREATURE)
  ensureSmartAiName()
  manager.setNewEntries([...rows.value, row])
  applyTree(buildScriptGroups(manager.getNewEntries()))
  select(row)
}

function addLink(node: SaiCardNode) {
  const tree = buildScriptGroups(rows.value)
  // Attach at the end of the chain of the top-level card containing the row
  for (const group of tree) {
    for (const top of group.nodes) {
      if (top.row !== node.row && !top.children.some(c => c.row === node.row)) continue
      const row = createRow(node.row.entryorguid, node.row.source_type)
      row.event_type = SAI_EVENT_LINK
      row.comment = buildComment(props.ownerName, row)
      top.children.push({ row, children: [] })
      applyTree(tree)
      select(row)
      return
    }
  }
}

function removeNode(node: SaiCardNode) {
  const tree = buildScriptGroups(rows.value)
  const location = findNode(tree, node.row)
  if (!location) return
  const removed = location.list.splice(location.index, 1)
  const removedRows = removed.flatMap(n => [n.row, ...n.children.map(c => c.row)])
  store.saiConditions.removeForRows(removedRows)
  applyTree(tree)
  if (selectedRow.value === node.row || node.children.some(c => c.row === selectedRow.value)) {
    selectedRow.value = null
    drawerVisible.value = false
  }
}

function moveNode(node: SaiCardNode, direction: -1 | 1) {
  const tree = buildScriptGroups(rows.value)
  const location = findNode(tree, node.row)
  if (!location) return
  const target = location.index + direction
  if (target < 0 || target >= location.list.length) return
  const [moved] = location.list.splice(location.index, 1)
  if (!moved) return
  location.list.splice(target, 0, moved)
  applyTree(tree)
}

async function openActionlist(id: number) {
  const existing = groups.value.find(g => g.entryorguid === id && g.sourceType === SAI_SOURCE_TYPE_TIMED_ACTIONLIST)
  if (existing) {
    const firstNode = existing.nodes[0]
    if (firstNode) select(firstNode.row)
    return
  }
  // Referenced but not loaded and empty: register it as owned and start it
  const fetched = await saiService.getSmartScripts([id], [SAI_SOURCE_TYPE_TIMED_ACTIONLIST]).catch(() => [])
  if (fetched.length > 0) {
    manager.setNewEntries([...rows.value, ...fetched])
    manager.addOwnedKey({ entryorguid: id, sourceType: SAI_SOURCE_TYPE_TIMED_ACTIONLIST })
    return
  }
  createActionlistWithId(id)
}

function nextActionlistId(): number | null {
  const entry = store.formData.entry
  const used = new Set(
    groups.value
      .filter(g => g.sourceType === SAI_SOURCE_TYPE_TIMED_ACTIONLIST)
      .map(g => g.entryorguid),
  )
  for (let n = 0; n < 100; n++) {
    const id = entry * 100 + n
    if (!used.has(id)) return id
  }
  return null
}

function createActionlistWithId(id: number) {
  const row = createRow(id, SAI_SOURCE_TYPE_TIMED_ACTIONLIST)
  manager.setNewEntries([...rows.value, row])
  manager.addOwnedKey({ entryorguid: id, sourceType: SAI_SOURCE_TYPE_TIMED_ACTIONLIST })
  applyTree(buildScriptGroups(manager.getNewEntries()))
  select(row)
}

function addActionlist() {
  const id = nextActionlistId()
  if (id == null) return
  createActionlistWithId(id)
}

const isEmpty = computed(() => rows.value.length === 0)
</script>

<template>
  <div class="sai-editor">
    <div class="sai-toolbar">
      <SelectButton
        v-model="viewMode"
        :options="viewOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        size="small"
      />
      <MultiSelect
        v-model="phaseFilter"
        :options="phaseFilterOptions"
        optionLabel="label"
        optionValue="value"
        :placeholder="t('creature_template.smart_ai.filterPhases')"
        :maxSelectedLabels="2"
        showClear
        size="small"
        class="sai-phase-filter"
      />
      <span class="sai-toolbar-spacer" />
      <Button
        icon="pi pi-list"
        size="small"
        severity="secondary"
        :label="t('creature_template.smart_ai.addActionlist')"
        :disabled="nextActionlistId() == null"
        @click="addActionlist"
      />
    </div>

    <div v-if="isEmpty" class="sai-empty">
      <i class="pi pi-sitemap sai-empty-icon" />
      <p>{{ t('creature_template.smart_ai.emptyScript') }}</p>
      <Button
        icon="pi pi-plus"
        :label="t('creature_template.smart_ai.createFirst')"
        @click="addFirstRow"
      />
    </div>

    <SaiCardList
      v-else-if="viewMode === 'cards'"
      :groups="groups"
      :selectedRow="selectedRow"
      :entry="store.formData.entry"
      :phaseFilter="phaseFilter"
      :conditionsFor="conditionsFor"
      @select="select"
      @remove="removeNode"
      @move="moveNode"
      @add-link="addLink"
      @add-row="addRow"
      @open-actionlist="openActionlist"
    />

    <SaiTableView
      v-else
      :rows="rows"
      :selectedRow="selectedRow"
      @select="select"
    />

    <SaiEditPanel
      v-model:visible="drawerVisible"
      :row="selectedRow"
      :ownerName="ownerName"
      :isLinked="selectedIsLinked"
    />
  </div>
</template>

<style scoped>
.sai-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sai-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sai-toolbar-spacer {
  flex: 1;
}

.sai-phase-filter {
  min-width: 12rem;
}

.sai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem;
  border: 1px dashed rgba(51, 65, 85, 0.6);
  border-radius: 10px;
  color: #94a3b8;
}

.sai-empty-icon {
  font-size: 2rem;
  color: #475569;
}

.sai-empty p {
  margin: 0;
}
</style>
