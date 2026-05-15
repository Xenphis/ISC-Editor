<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import EditorHeader from '@/components/EditorHeader.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useQueryGenerator } from '@/composables/useQueryGenerator'
import type { QuestTemplate } from '@/modules/quests/types/quest_template'
import { getQuest, getQuestAddon, getQuestLocales, saveQuest } from '@/modules/quests/service'
import { useQuestModuleStore, type AddonForm, type LocaleEntry } from '@/modules/quests/store'
import QuestTabGeneral from './editor/quest_template/GeneralTab.vue'
import QuestTabObjectives from './editor/quest_template/ObjectivesTab.vue'
import QuestTabRewards from './editor/quest_template/RewardsTab.vue'
import QuestTabChain from './editor/quest_template/ChainTab.vue'
import QuestTabLocale from './editor/quest_template/LocaleTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useQuestModuleStore()

const questId = computed(() => {
  const param = route.params.id as string | undefined
  if (!param || param === 'new') return null
  const n = Number(param)
  return Number.isNaN(n) ? null : n
})

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

const { diffQuery, fullQuery, hasChanges, changedFields } = useQueryGenerator<QuestTemplate>(
  'quest_template',
  'ID',
  originalValue,
  form,
)

const combinedDiffQuery = computed(() => {
  const parts: string[] = []
  if (diffQuery.value) parts.push(diffQuery.value)
  for (const st of store.subTables) {
    const sql = st.getSqlDiff(form.ID)
    if (sql) parts.push(sql)
  }
  return parts.join('\n')
})

const combinedHasChanges = computed(() => {
  if (hasChanges.value) return true
  for (const st of store.subTables) {
    if (st.getSqlDiff(form.ID)) return true
  }
  return false
})

const combinedChangedFields = computed(() => {
  const fields = [...changedFields.value]
  for (const st of store.subTables) {
    fields.push(...st.getChangedFields(form.ID))
  }
  return fields
})

async function onSave() {
  try {
    await saveQuest({ ...form })
    store.discardEditor()
    router.push('/quests')
  } catch (e) {
    console.error('Failed to save quest:', e)
  }
}

function onClose() {
  store.closeEditor()
  router.push('/quests')
}

function onDiscard() {
  if (questId.value != null) {
    Object.assign(form, originalValue.value)
    for (const st of store.subTables) {
      st.revert()
    }
  }
}

onMounted(async () => {
  if (store.editorDataLoaded) return

  if (!store.editing || store.editingId !== questId.value) {
    store.openEditor(questId.value)
  }

  if (questId.value != null) {
    loading.value = true
    try {
      const id = questId.value
      const [data, addonData, localeRows] = await Promise.all([
        getQuest(id),
        getQuestAddon(id).catch(() => null),
        getQuestLocales(id).catch(() => []),
      ])

      Object.assign(form, data)
      originalValue.value = { ...data }

      if (addonData) {
        const { ID: _id, ...addonFields } = addonData
        store.addon.load(addonFields as AddonForm)
      } else {
        store.addon.commit()
      }

      const locEntries: LocaleEntry[] = localeRows.map(r => ({
        locale: r.locale,
        Title: r.Title ?? null,
        Details: r.Details ?? null,
        Objectives: r.Objectives ?? null,
        EndText: r.EndText ?? null,
        CompletedText: r.CompletedText ?? null,
        ObjectiveText1: r.ObjectiveText1 ?? null,
        ObjectiveText2: r.ObjectiveText2 ?? null,
        ObjectiveText3: r.ObjectiveText3 ?? null,
        ObjectiveText4: r.ObjectiveText4 ?? null,
      }))
      store.locales.load(locEntries)

    } catch (e) {
      console.error('Failed to load quest:', e)
    } finally {
      loading.value = false
    }
  } else {
    originalValue.value = { ...form }
    for (const st of store.subTables) {
      st.commit()
    }
  }

  store.markEditorLoaded()
})
</script>

<template>
  <div class="quest-editor">
    <EditorHeader
      :title="t('quest_template.editorTitle')"
      :subtitle="form.LogTitle || undefined"
      :id="questId ?? undefined"
      :backLabel="t('quest_template.back')"
      :discardLabel="t('quest_template.discard')"
      :executeLabel="t('quest_template.execute')"
      :hasChanges="combinedHasChanges"
      @back="onClose"
      @discard="onDiscard"
      @execute="onSave"
    />

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #06b6d4"></i>
    </div>

    <template v-else>
      <SqlQueryPanel
        :diffQuery="combinedDiffQuery"
        :fullQuery="fullQuery"
        :changedFields="combinedChangedFields"
        :hasChanges="combinedHasChanges"
      />

      <Tabs value="general">
        <TabList>
          <Tab value="general">{{ t('quest_template.tabs.general') }}</Tab>
          <Tab value="objectives">{{ t('quest_template.tabs.objectives') }}</Tab>
          <Tab value="rewards">{{ t('quest_template.tabs.rewards') }}</Tab>
          <Tab value="chain">{{ t('quest_template.tabs.chain') }}</Tab>
          <Tab value="locale">{{ t('quest_template.tabs.locale') }}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="general">
            <QuestTabGeneral />
          </TabPanel>
          <TabPanel value="objectives">
            <QuestTabObjectives />
          </TabPanel>
          <TabPanel value="rewards">
            <QuestTabRewards />
          </TabPanel>
          <TabPanel value="chain">
            <QuestTabChain />
          </TabPanel>
          <TabPanel value="locale">
            <QuestTabLocale />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </div>
</template>

<style scoped>
.quest-editor {
  padding: 1.5rem;
  max-width: 80rem;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

/* Override PrimeVue input styles for dark theme */
:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  height: 2.6rem !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber-input:focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-inputnumber-input::placeholder) {
  color: #475569 !important;
}

:deep(.p-select) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  height: 2.6rem !important;
}

:deep(.p-select .p-select-label) {
  padding: 0 0.75rem !important;
  line-height: 2.6rem !important;
}

:deep(.p-select:focus),
:deep(.p-select.p-focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15) !important;
}

:deep(.p-select-label) {
  color: #e2e8f0 !important;
}

/* Textarea */
:deep(.p-textarea) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem;
  resize: vertical;
}

:deep(.p-textarea:focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15) !important;
}

/* Tabs styling */
:deep(.p-tabs) {
  background: transparent !important;
}

:deep(.p-tablist) {
  background: transparent !important;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

:deep(.p-tablist-content) {
  background: transparent !important;
}

:deep(.p-tablist-tab-list) {
  background: transparent !important;
  border: none !important;
}

:deep(.p-tab) {
  color: #94a3b8 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.p-tab:hover) {
  color: #e2e8f0 !important;
  background: rgba(30, 41, 59, 0.3) !important;
  border-radius: 0.75rem 0.75rem 0 0 !important;
}

:deep(.p-tab-active),
:deep(.p-tab[data-p-active="true"]),
:deep(.p-tab[aria-selected="true"]) {
  color: #22d3ee !important;
  background: rgba(15, 23, 42, 0.6) !important;
  border-bottom: 2px solid #22d3ee !important;
  border-radius: 0.75rem 0.75rem 0 0 !important;
}

:deep(.p-tablist-active-bar) {
  background: #22d3ee !important;
}

:deep(.p-tabpanels) {
  background: transparent !important;
  padding: 1.5rem 0 0 0 !important;
}

:deep(.p-tabpanel) {
  background: transparent !important;
  padding: 0 !important;
}
</style>
