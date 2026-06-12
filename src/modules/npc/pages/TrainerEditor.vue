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
import { useTrainerStore } from '@/modules/npc/stores/trainerStore'
import TrainerGeneralTab from './editor/trainer/GeneralTab.vue'
import TrainerSpellsTab from './editor/trainer/SpellsTab.vue'
import TrainerCreatureTab from './editor/trainer/CreatureTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useTrainerStore()

const trainerId = computed(() => {
  const param = route.params.id as string | undefined
  if (!param) return null
  const n = Number(param)
  return Number.isNaN(n) ? null : n
})

const loading = ref(false)
const form = store.formData

// --- Save ---
async function onExecute() {
  try {
    await store.saveCurrent()
    store.discardEditor()
    router.push('/npc/trainer')
  } catch (e) {
    console.error('Failed to save trainer:', e)
  }
}

function onBack() {
  store.closeEditor()
  router.push('/npc/trainer')
}

function onDiscard() {
  store.discardChanges()
}

onMounted(async () => {
  if (store.editorDataLoaded && store.editing && store.editingId === trainerId.value) return

  loading.value = true
  try {
    await store.openEditor(trainerId.value)
  } catch (e) {
    console.error('Failed to load trainer:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="trainer-editor">
    <EditorHeader
      :title="t('trainer.editorTitle')"
      :subtitle="form.Greeting ?? undefined"
      :id="trainerId ?? undefined"
      :backLabel="t('trainer.back')"
      :hasChanges="store.combinedHasChanges"
      :discardLabel="t('trainer.discard')"
      :executeLabel="t('trainer.execute')"
      @back="onBack"
      @discard="onDiscard"
      @execute="onExecute"
    />

    <SqlQueryPanel
      :diffQuery="store.combinedDiffQuery"
      :fullQuery="store.combinedFullQuery"
      :hasChanges="store.combinedHasChanges"
      :changedFields="store.combinedChangedFields"
    />

    <Tabs value="general">
      <TabList>
        <Tab value="general">{{ t('trainer.tabs.general') }}</Tab>
        <Tab value="spells">{{ t('trainer.tabs.spells') }}</Tab>
        <Tab value="creature">{{ t('trainer.tabs.creature') }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="general">
          <TrainerGeneralTab />
        </TabPanel>
        <TabPanel value="spells">
          <TrainerSpellsTab />
        </TabPanel>
        <TabPanel value="creature">
          <TrainerCreatureTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
</style>
