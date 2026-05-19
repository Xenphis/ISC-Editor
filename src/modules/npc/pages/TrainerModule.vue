<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { Trainer } from '@/modules/npc/types/trainer/trainer'
import { getTrainers, deleteTrainer } from '@/modules/npc/service'
import { useTrainerStore } from '@/modules/npc/stores/trainerStore'

const { t } = useI18n()
const router = useRouter()
const store = useTrainerStore()

const typeMap: Record<number, { label: string; color: string }> = {
  0: { label: 'Class', color: '#60a5fa' },
  1: { label: 'Mount', color: '#f59e0b' },
  2: { label: 'Tradeskill', color: '#4ade80' },
  3: { label: 'Pet', color: '#f87171' },
}

function getTypeLabel(type: number): string {
  return typeMap[type]?.label ?? `Type ${type}`
}

function getTypeColor(type: number): string {
  return typeMap[type]?.color ?? '#cbd5e1'
}

const searchQuery = ref('')

async function loadTrainers() {
  store.loading = true
  try {
    const data = await getTrainers()
    store.setTrainers(data)
    store.markListLoaded()
  } catch (e) {
    console.error('Failed to load trainers:', e)
  } finally {
    store.loading = false
  }
}

function onSearch(query: string) {
  searchQuery.value = query
}

function filteredTrainers() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.trainers
  const n = Number(q)
  return store.trainers.filter(tr =>
    (!isNaN(n) && tr.Id === n) ||
    getTypeLabel(tr.Type).toLowerCase().includes(q) ||
    (tr.Greeting ?? '').toLowerCase().includes(q)
  )
}

function onEdit(trainer: Trainer) {
  store.openEditor(trainer.Id)
  router.push(`/npc/trainer/${trainer.Id}`)
}

async function onDelete(trainer: Trainer) {
  try {
    await deleteTrainer(trainer.Id)
    await loadTrainers()
  } catch (e) {
    console.error('Failed to delete trainer:', e)
  }
}

function onAdd() {
  store.openEditor(null)
  router.push('/npc/trainer/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadTrainers()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('trainer.title')"
    :description="t('trainer.description')"
    :searchPlaceholder="t('trainer.searchPlaceholder')"
    :addButtonLabel="t('trainer.addButton')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="filteredTrainers()"
      dataKey="Id"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="Id" :header="t('trainer.columns.id')" style="width: 7rem" sortable />

      <Column :header="t('trainer.columns.type')" style="width: 10rem">
        <template #body="{ data }">
          <span :style="{ color: getTypeColor(data.Type), fontWeight: 500 }">
            {{ getTypeLabel(data.Type) }}
          </span>
        </template>
      </Column>

      <Column field="Requirement" :header="t('trainer.columns.requirement')" style="width: 10rem" />

      <Column :header="t('trainer.columns.greeting')" style="min-width: 14rem">
        <template #body="{ data }">
          <span class="greeting-text">{{ data.Greeting ?? '—' }}</span>
        </template>
      </Column>

      <Column :header="t('trainer.columns.actions')" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.greeting-text {
  color: #94a3b8;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 28rem;
  display: block;
}
</style>
