<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import EditorHeader from '@/components/EditorHeader.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useQuestModuleStore } from '@/modules/quests/store'
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

async function onSave() {
  try {
    await store.saveCurrent()
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
  store.discardChanges()
}

onMounted(async () => {
  if (store.editorDataLoaded && store.editing && store.editingId === questId.value) return

  loading.value = true
  try {
    await store.openEditor(questId.value)
  } catch (e) {
    console.error('Failed to load quest:', e)
  } finally {
    loading.value = false
  }
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
      :hasChanges="store.combinedHasChanges"
      @back="onClose"
      @discard="onDiscard"
      @execute="onSave"
    />

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #06b6d4"></i>
    </div>

    <template v-else>
      <SqlQueryPanel
        :diffQuery="store.combinedDiffQuery"
        :fullQuery="store.combinedFullQuery"
        :changedFields="store.combinedChangedFields"
        :hasChanges="store.combinedHasChanges"
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
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
}

/* Inputs, selects, textareas, tabs: see src/styles/forms.css (global base) */
</style>
