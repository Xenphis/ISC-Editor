<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { InstanceTemplate } from '@/modules/map/types/instance_template'
import { useInstanceStore } from '@/modules/map/stores/instance'

const { t } = useI18n()
const router = useRouter()
const store = useInstanceStore()

async function loadEntries() {
  await store.fetchEntries(store.currentSearch || undefined, 50)
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadEntries()
}

function onEdit(row: InstanceTemplate) {
  router.push(`/maps/instances/${row.map}`)
}

async function onDelete(row: InstanceTemplate) {
  try {
    await store.deleteEntry(row.map)
  } catch (e) {
    console.error('Failed to delete instance:', e)
  }
}

function onAdd() {
  router.push('/maps/instances/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadEntries()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('instance.title')"
    :description="t('instance.description')"
    :searchPlaceholder="t('instance.searchPlaceholder')"
    :addButtonLabel="t('instance.addNew')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.entries"
      dataKey="map"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="map" :header="t('instance_template.fields.map')" style="width: 7rem" />
      <Column field="parent" :header="t('instance_template.fields.parent')" style="width: 8rem" />
      <Column field="script" :header="t('instance_template.fields.script')" style="min-width: 14rem">
        <template #body="{ data }">
          <span class="text-muted">{{ data.script || '—' }}</span>
        </template>
      </Column>
      <Column field="allowMount" :header="t('instance_template.fields.allowMount')" style="width: 8rem" />

      <Column style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>
