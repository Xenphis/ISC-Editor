<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { QuestTemplate } from '@/modules/quests/types/quest_template'
import { getQuests, deleteQuest } from '@/modules/quests/service'
import { useQuestModuleStore } from '@/modules/quests/store'

const { t } = useI18n()
const router = useRouter()
const store = useQuestModuleStore()

const questTypeMap: Record<number, { label: string; color: string }> = {
  0: { label: 'Auto-complete', color: '#94a3b8' },
  1: { label: 'Disabled', color: '#64748b' },
  2: { label: 'Normal', color: '#4ade80' },
  3: { label: 'World Quest', color: '#60a5fa' },
}

function getTypeLabel(type: number): string {
  return questTypeMap[type]?.label || `Type ${type}`
}

function getTypeColor(type: number): string {
  return questTypeMap[type]?.color || '#cbd5e1'
}

async function loadQuests() {
  store.loading = true
  try {
    const result = await getQuests(store.currentSearch || undefined, 50)
    store.setQuests(result.data)
    store.markListLoaded()
  } catch (e) {
    console.error('Failed to load quests:', e)
  } finally {
    store.loading = false
  }
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadQuests()
}

function onEdit(quest: QuestTemplate) {
  store.openEditor(quest.ID)
  router.push(`/quests/${quest.ID}`)
}

async function onDelete(quest: QuestTemplate) {
  try {
    await deleteQuest(quest.ID)
    await loadQuests()
  } catch (e) {
    console.error('Failed to delete quest:', e)
  }
}

function onAdd() {
  store.openEditor(null)
  router.push('/quests/new')
}

onMounted(() => {
  if (!store.listLoaded) {
    loadQuests()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('quest.title')"
    :description="t('quest.description')"
    :searchPlaceholder="t('quest.searchPlaceholder')"
    :addButtonLabel="t('quest.addButton')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.quests"
      dataKey="ID"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column field="ID" :header="t('quest.columns.id')" style="width: 7rem" />

      <Column :header="t('quest.columns.title')" style="min-width: 16rem">
        <template #body="{ data }">
          <span class="quest-title">{{ data.LogTitle || `#${data.ID}` }}</span>
        </template>
      </Column>

      <Column :header="t('quest.columns.level')" style="width: 8rem">
        <template #body="{ data }">
          <span>{{ data.QuestLevel === -1 ? 'Scaling' : data.QuestLevel }}</span>
        </template>
      </Column>

      <Column :header="t('quest.columns.type')" style="width: 10rem">
        <template #body="{ data }">
          <span :style="{ color: getTypeColor(data.QuestType), fontWeight: 500 }">
            {{ getTypeLabel(data.QuestType) }}
          </span>
        </template>
      </Column>

      <Column :header="t('quest.columns.actions')" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.quest-title {
  color: #e2e8f0;
  font-weight: 500;
}
</style>
