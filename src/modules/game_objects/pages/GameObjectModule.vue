<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { GameObjectTemplate } from '@/modules/game_objects/types/gameobject_template/gameobject_template'
import { game_object_type_options } from '@/modules/game_objects/types/defines'
import { getGameObjects, deleteGameObject } from '@/modules/game_objects/service'
import { useGameObjectModuleStore } from '@/modules/game_objects/store'

const { t } = useI18n()
const router = useRouter()
const store = useGameObjectModuleStore()

const typeMap = new Map(game_object_type_options.map(o => [o.value, o.name]))

function getTypeLabel(type: number): string {
  return typeMap.get(type) || `Type ${type}`
}

async function loadGameObjects() {
  store.loading = true
  try {
    const result = await getGameObjects(store.currentSearch || undefined, 50)
    store.setGameObjects(result.data)
    store.markListLoaded()
  } catch (e) {
    console.error('Failed to load game objects:', e)
  } finally {
    store.loading = false
  }
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadGameObjects()
}

function onEdit(go: GameObjectTemplate) {
  store.openEditor(go.entry)
  router.push(`/gameobject/${go.entry}`)
}

async function onDelete(go: GameObjectTemplate) {
  try {
    await deleteGameObject(go.entry)
    await loadGameObjects()
  } catch (e) {
    console.error('Failed to delete game object:', e)
  }
}

function onAdd() {
  store.openEditor(null)
  router.push('/gameobject/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadGameObjects()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('gameobject.title')"
    :description="t('gameobject.description')"
    :searchPlaceholder="t('gameobject.searchPlaceholder')"
    :addButtonLabel="t('gameobject.addButton')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.gameObjects"
      dataKey="entry"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="entry" :header="t('gameobject.columns.entry')" style="width: 8rem" />

      <Column field="name" :header="t('gameobject.columns.name')" style="min-width: 14rem">
        <template #body="{ data }">
          <span class="go-name">{{ data.name }}</span>
        </template>
      </Column>

      <Column :header="t('gameobject.columns.type')" style="width: 12rem">
        <template #body="{ data }">
          <span class="go-type">{{ getTypeLabel(data.type) }}</span>
        </template>
      </Column>

      <Column field="displayId" :header="t('gameobject.columns.displayId')" style="width: 8rem" />

      <Column :header="t('gameobject.columns.actions')" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.go-name {
  color: #e2e8f0;
  font-weight: 500;
}

.go-type {
  color: #60a5fa;
  font-weight: 500;
}
</style>
