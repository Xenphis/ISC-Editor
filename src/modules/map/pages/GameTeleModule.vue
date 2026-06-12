<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { GameTele } from '@/modules/map/types/game_tele'
import { useGameTeleStore } from '@/modules/map/stores/game_tele'

const { t } = useI18n()
const router = useRouter()
const store = useGameTeleStore()

async function loadEntries() {
  await store.fetchEntries(store.currentSearch || undefined, 50)
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadEntries()
}

function onEdit(row: GameTele) {
  router.push(`/maps/teleport/${row.id}`)
}

async function onDelete(row: GameTele) {
  try {
    await store.deleteEntry(row.id)
  } catch (e) {
    console.error('Failed to delete game tele:', e)
  }
}

function onAdd() {
  router.push('/maps/teleport/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadEntries()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('game_tele.title')"
    :description="t('game_tele.description')"
    :searchPlaceholder="t('game_tele.searchPlaceholder')"
    :addButtonLabel="t('game_tele.addNew')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.entries"
      dataKey="id"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="id" :header="t('game_tele.fields.id')" style="width: 7rem" />
      <Column field="name" :header="t('game_tele.fields.name')" style="min-width: 14rem" />
      <Column field="map" :header="t('game_tele.fields.map')" style="width: 7rem" />
      <Column :header="t('game_tele.fields.position')" style="min-width: 12rem">
        <template #body="{ data }">
          <span class="text-muted">{{ data.position_x.toFixed(2) }}, {{ data.position_y.toFixed(2) }}, {{ data.position_z.toFixed(2) }}</span>
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
