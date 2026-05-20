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
import type { Creature } from '@/modules/npc/types/creature/creature'
import { getCreatureSpawns, saveCreatureSpawn, deleteCreatureSpawn } from '@/modules/npc/service'
import CreatureEditor from './CreatureEditor.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import NpcTabGeneral from './editor/creature_template/GeneralTab.vue'
import NpcTabCombat from './editor/creature_template/CombatTab.vue'
import NpcTabAppearance from './editor/creature_template/AppearanceTab.vue'
import NpcTabBehavior from './editor/creature_template/BehaviorTab.vue'
import NpcTabLoot from './editor/creature_template/LootTab.vue'
import NpcTabAdvanced from './editor/creature_template/AdvancedTab.vue'
import NpcTabSpawn from './editor/creature_template/SpawnTab.vue'
import NpcTabText from './editor/creature_template/TextTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useNpcModuleStore()

const npcEntry = computed(() => {
  const param = route.params.entry as string | undefined

  if (!param) {
    return null
  }

  const n = Number(param)
  return Number.isNaN(n) ? null : n
})

const loading = ref(false)
const form = store.formData

// --- Spawn state ---
const spawns = ref<Creature[]>([])
const spawnsLoading = ref(false)
const editingSpawnGuid = ref<number | null>(null)

async function loadSpawns() {
  if (npcEntry.value == null) return

  spawnsLoading.value = true

  try {
    spawns.value = await getCreatureSpawns(npcEntry.value!)
  } catch (e) {
    console.error('Failed to load spawns:', e)
  } finally {
    spawnsLoading.value = false
  }
}

function onEditSpawn(spawn: Creature) {
  editingSpawnGuid.value = spawn.guid
}

async function onDeleteSpawn(spawn: Creature) {
  try {
    await deleteCreatureSpawn(spawn.guid)
    await loadSpawns()
  } catch (e) {
    console.error('Failed to delete spawn:', e)
  }
}

function onCreatureEditorClose() {
  editingSpawnGuid.value = null
  loadSpawns()
}

async function onCreatureEditorSave(data: Creature) {
  try {
    await saveCreatureSpawn(data)
    editingSpawnGuid.value = null
    await loadSpawns()
  } catch (e) {
    console.error('Failed to save spawn:', e)
  }
}

async function onSave() {
  try {
    await store.saveCurrent()
    store.discardEditor()
    router.push('/npc/creature-template')
  } catch (e) {
    console.error('Failed to save NPC:', e)
  }
}

function onClose() {
  store.closeEditor()
  router.push('/npc/creature-template')
}

function onDiscard() {
  store.discardChanges()
}

onMounted(async () => {
  if (store.editorDataLoaded && store.editingEntry === npcEntry.value) {
    loadSpawns()
    return
  }

  loading.value = true
  try {
    await store.openEditor(npcEntry.value)
  } catch (e) {
    console.error('Failed to load NPC:', e)
  } finally {
    loading.value = false
  }

  loadSpawns()
})
</script>

<template>
  <!-- Creature Editor (replaces NPC editor when editing a creature) -->
  <CreatureEditor
    v-if="editingSpawnGuid != null"
    :spawnGuid="editingSpawnGuid"
    :npcEntry="form.entry"
    @close="onCreatureEditorClose"
    @save="onCreatureEditorSave"
  />

  <div v-else class="npc-editor">
    <!-- Header -->
    <EditorHeader
      :title="t('creature_template.editorTitle')"
      :subtitle="form.name || undefined"
      :id="form.entry"
      :backLabel="t('creature_template.back')"
      :hasChanges="store.combinedHasChanges"
      :discardLabel="t('creature_template.discard')"
      :executeLabel="t('creature_template.execute')"
      @back="onClose"
      @discard="onDiscard"
      @execute="onSave"
    />

    <!-- SQL Query Panel -->
    <SqlQueryPanel
      :diffQuery="store.combinedDiffQuery"
      :fullQuery="store.combinedFullQuery"
      :hasChanges="store.combinedHasChanges"
      :changedFields="store.combinedChangedFields"
    />

    <!-- Tabs -->
    <Tabs value="general">
      <TabList>
        <Tab value="general">{{ t('creature_template.tabs.general') }}</Tab>
        <Tab value="combat">{{ t('creature_template.tabs.combat') }}</Tab>
        <Tab value="appearance">{{ t('creature_template.tabs.appearance') }}</Tab>
        <Tab value="behavior">{{ t('creature_template.tabs.behavior') }}</Tab>
        <Tab value="loot">{{ t('creature_template.tabs.loot') }}</Tab>
        <Tab value="text">{{ t('creature_template.tabs.text') }}</Tab>
        <Tab value="advanced">{{ t('creature_template.tabs.advanced') }}</Tab>
        <Tab value="spawn">{{ t('creature_template.tabs.spawn') }} ({{ spawns.length }})</Tab>
      </TabList>

      <TabPanels>
        <TabPanel value="general"><NpcTabGeneral /></TabPanel>
        <TabPanel value="combat"><NpcTabCombat /></TabPanel>
        <TabPanel value="appearance"><NpcTabAppearance /></TabPanel>
        <TabPanel value="behavior"><NpcTabBehavior /></TabPanel>
        <TabPanel value="loot"><NpcTabLoot /></TabPanel>
        <TabPanel value="text"><NpcTabText /></TabPanel>
        <TabPanel value="advanced"><NpcTabAdvanced /></TabPanel>
        <TabPanel value="spawn">
          <NpcTabSpawn :spawns="spawns" @edit="onEditSpawn" @delete="onDeleteSpawn" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.npc-editor {
  max-width: 80rem;
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

/* Panel overrides (penetrate into child tab components) */
:deep(.p-panel) {
  background: transparent !important;
  border: none !important;
  border-radius: 8px !important;
  margin-bottom: 1.5rem;
}

:deep(.p-panel *) {
  border-color: rgba(51, 65, 85, 0.4) !important;
}

:deep(.p-panel-header) {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(51, 65, 85, 0.4) !important;
  border-radius: 8px 8px 0 0 !important;
  color: #e2e8f0 !important;
}

:deep(.p-panel-content-container) {
  border: none !important;
  background: transparent !important;
}

:deep(.p-panel-content) {
  background: rgba(15, 23, 42, 0.3) !important;
  border: 1px solid rgba(51, 65, 85, 0.4) !important;
  border-top: none !important;
  border-radius: 0 0 8px 8px !important;
  color: #e2e8f0 !important;
}

:deep(.p-panel-title) {
  color: #e2e8f0 !important;
}

:deep(.p-panel-toggle-button) {
  background: transparent !important;
  border: none !important;
  color: #94a3b8 !important;
}

:deep(.locale-panel-modified .p-panel-header) {
  border-color: rgba(6, 182, 212, 0.4) !important;
  background: rgba(6, 182, 212, 0.05) !important;
}
</style>
