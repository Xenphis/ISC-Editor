<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { AccessRequirement } from '@/modules/map/types/access_requirement'
import { useMapModuleStore } from '@/modules/map/store'

const { t } = useI18n()
const router = useRouter()
const store = useMapModuleStore()

const difficultyLabels: Record<number, string> = {
  0: 'Normal',
  1: 'Heroic',
  2: '10-player',
  3: '25-player',
  4: '10-player Heroic',
  5: '25-player Heroic',
}

function getDifficultyLabel(difficulty: number): string {
  return difficultyLabels[difficulty] ?? `Difficulty ${difficulty}`
}

async function loadEntries() {
  await store.fetchEntries(store.currentSearch || undefined, 50)
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadEntries()
}

function onEdit(row: AccessRequirement) {
  router.push(`/maps/access-requirement/${row.mapId}/${row.difficulty}`)
}

async function onDelete(row: AccessRequirement) {
  try {
    await store.deleteEntry(row.mapId, row.difficulty)
  } catch (e) {
    console.error('Failed to delete access requirement:', e)
  }
}

function onAdd() {
  router.push('/maps/access-requirement/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadEntries()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('access_requirement.title')"
    :description="t('access_requirement.description')"
    :searchPlaceholder="t('access_requirement.searchPlaceholder')"
    :addButtonLabel="t('access_requirement.addNew')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.entries"
      dataKey="mapId"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="mapId" :header="t('access_requirement.fields.mapId')" style="width: 8rem" />

      <Column :header="t('access_requirement.fields.difficulty')" style="width: 10rem">
        <template #body="{ data }">
          {{ getDifficultyLabel(data.difficulty) }}
        </template>
      </Column>

      <Column :header="t('access_requirement.fields.level_min')" style="width: 8rem">
        <template #body="{ data }">
          {{ data.level_min > 0 ? data.level_min : '—' }}
        </template>
      </Column>

      <Column :header="t('access_requirement.fields.level_max')" style="width: 8rem">
        <template #body="{ data }">
          {{ data.level_max > 0 ? data.level_max : '—' }}
        </template>
      </Column>

      <Column field="comment" :header="t('access_requirement.fields.comment')" style="min-width: 14rem">
        <template #body="{ data }">
          <span class="text-muted">{{ data.comment || '—' }}</span>
        </template>
      </Column>

      <Column style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>
