<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { ExplorationBasexp } from '@/modules/map/types/exploration_basexp'
import { useExplorationBasexpStore } from '@/modules/map/stores/exploration_basexp'

const { t } = useI18n()
const router = useRouter()
const store = useExplorationBasexpStore()

async function loadEntries() {
  await store.fetchEntries(store.currentSearch || undefined, 50)
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadEntries()
}

function onEdit(row: ExplorationBasexp) {
  router.push(`/maps/exploration/${row.level}`)
}

async function onDelete(row: ExplorationBasexp) {
  try {
    await store.deleteEntry(row.level)
  } catch (e) {
    console.error('Failed to delete exploration basexp:', e)
  }
}

function onAdd() {
  router.push('/maps/exploration/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadEntries()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('exploration_basexp.title')"
    :description="t('exploration_basexp.description')"
    :searchPlaceholder="t('exploration_basexp.searchPlaceholder')"
    :addButtonLabel="t('exploration_basexp.addNew')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.entries"
      dataKey="level"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="level" :header="t('exploration_basexp.fields.level')" style="width: 10rem" />
      <Column field="basexp" :header="t('exploration_basexp.fields.basexp')" style="min-width: 12rem" />

      <Column style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>
