<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { CreatureTemplate } from '@/modules/npc/types/creature_template/creature_template'
import { getNpcs, deleteNpc } from '@/modules/npc/service'
import { useNpcModuleStore } from '@/modules/npc/store'

const { t } = useI18n()
const router = useRouter()
const store = useNpcModuleStore()

const typeMap: Record<number, { label: string; color: string }> = {
  0: { label: 'None', color: '#64748b' },
  1: { label: 'Beast', color: '#f59e0b' },
  2: { label: 'Dragonkin', color: '#f87171' },
  3: { label: 'Demon', color: '#ef4444' },
  4: { label: 'Elemental', color: '#60a5fa' },
  5: { label: 'Giant', color: '#a78bfa' },
  6: { label: 'Undead', color: '#94a3b8' },
  7: { label: 'Humanoid', color: '#4ade80' },
  8: { label: 'Critter', color: '#fbbf24' },
  9: { label: 'Mechanical', color: '#fb923c' },
  10: { label: 'Not specified', color: '#64748b' },
  11: { label: 'Totem', color: '#34d399' },
  12: { label: 'Non-combat Pet', color: '#c084fc' },
  15: { label: 'Gas Cloud', color: '#a3e635' },
}

function getTypeLabel(type: number): string {
  return typeMap[type]?.label || `Type ${type}`
}

function getTypeColor(type: number): string {
  return typeMap[type]?.color || '#cbd5e1'
}

function getLevelDisplay(npc: CreatureTemplate): string {
  if (npc.minlevel === npc.maxlevel) return String(npc.minlevel)
  return `${npc.minlevel} - ${npc.maxlevel}`
}

async function loadNpcs() {
  store.loading = true
  try {
    const result = await getNpcs(store.currentSearch || undefined, 50)
    store.setNpcs(result.data)
    store.markListLoaded()
  } catch (e) {
    console.error('Failed to load NPCs:', e)
  } finally {
    store.loading = false
  }
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadNpcs()
}

function onEdit(npc: CreatureTemplate) {
  store.openEditor(npc.entry)
  router.push(`/npc/creature-template/${npc.entry}`)
}

async function onDelete(npc: CreatureTemplate) {
  try {
    await deleteNpc(npc.entry)
    await loadNpcs()
  } catch (e) {
    console.error('Failed to delete NPC:', e)
  }
}

function onAdd() {
  store.openEditor(null)
  router.push('/npc/creature-template/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadNpcs()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('npc.title')"
    :description="t('npc.description')"
    :searchPlaceholder="t('npc.searchPlaceholder')"
    :addButtonLabel="t('npc.addButton')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.npcs"
      dataKey="entry"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="entry" :header="t('npc.columns.entry')" style="width: 8rem" />

      <Column field="name" :header="t('npc.columns.name')" style="min-width: 14rem">
        <template #body="{ data }">
          <div>
            <div class="npc-name">{{ data.name }}</div>
            <div v-if="data.subname" class="npc-subname">{{ data.subname }}</div>
          </div>
        </template>
      </Column>

      <Column :header="t('npc.columns.level')" style="width: 8rem">
        <template #body="{ data }">
          {{ getLevelDisplay(data) }}
        </template>
      </Column>

      <Column :header="t('npc.columns.type')" style="width: 10rem">
        <template #body="{ data }">
          <span :style="{ color: getTypeColor(data.type), fontWeight: 500 }">
            {{ getTypeLabel(data.type) }}
          </span>
        </template>
      </Column>

      <Column :header="t('npc.columns.actions')" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.npc-name {
  color: #e2e8f0;
  font-weight: 500;
}

.npc-subname {
  color: #64748b;
  font-size: 0.8rem;
  font-style: italic;
}
</style>
