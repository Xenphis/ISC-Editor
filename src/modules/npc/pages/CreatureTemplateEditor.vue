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
import NpcModelPanel from './editor/creature_template/NpcModelPanel.vue'

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
    <!-- Header (full width, above the split) -->
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

    <div class="editor-split">
      <div class="editor-main">
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

      <!-- Right info panel (collapsible) -->
      <NpcModelPanel
        :modelId="form.modelid1"
        :scale="form.scale"
        :name="form.name"
        :iconName="form.IconName"
      />
    </div>
  </div>
</template>

<style scoped>
/* Inputs, selects, tabs, panels: see src/styles/forms.css (global base) */

.editor-split {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.editor-main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1100px) {
  .editor-split {
    flex-direction: column;
  }
}
</style>
