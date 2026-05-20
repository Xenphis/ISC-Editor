<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Column from 'primevue/column'
import { game_object_type_options } from '@/modules/game_objects/types/defines'
import type { GameObject } from '@/modules/game_objects/types/gameobject/gameobject'
import { getGameObjectSpawns, saveGameObjectSpawn, deleteGameObjectSpawn } from '@/modules/game_objects/service'
import GameObjectSpawnEditor from './GameObjectSpawnEditor.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import EditorField from '@/components/EditorField.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import EditableDataTable, { type ColumnDef } from '@/components/EditableDataTable.vue'
import { useGameObjectModuleStore } from '@/modules/game_objects/store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGameObjectModuleStore()

const goEntry = computed(() => {
  const param = route.params.entry as string | undefined
  if (!param) return null
  const n = Number(param)
  return Number.isNaN(n) ? null : n
})

const loading = ref(false)
const form = store.formData

const typeOptions = game_object_type_options.map(o => ({ value: o.value, label: o.name }))

// --- Field modification helpers ---
const modifiedFieldSet = computed(() => new Set(store.changedFields.map(c => c.field)))
function isFieldModified(field: string): boolean {
  return modifiedFieldSet.value.has(field)
}

const addonChangedFields = computed(() => store.addon.getChangedFields(form.entry))
const addonModifiedFieldSet = computed(() => new Set(addonChangedFields.value.map(c => c.field)))
function isAddonModified(field: string): boolean {
  return addonModifiedFieldSet.value.has(field)
}

// --- Addon form ---
const addonForm = store.addon.newEntry

// --- Loot ---
const lootEntries = computed(() => store.loot.getNewEntries())
const lootHasChanges = computed(() => store.loot.getSqlDiff(form.entry).length > 0)

const lootColumns: ColumnDef[] = [
  { field: 'Item', header: t('gameobjectEditor.fields.loot_item'), type: 'number', width: '7rem' },
  { field: 'Chance', header: t('gameobjectEditor.fields.loot_chance'), type: 'number', width: '6rem', fractionDigits: { min: 1, max: 2 } },
  { field: 'MinCount', header: t('gameobjectEditor.fields.loot_min_count'), type: 'number', width: '5rem' },
  { field: 'MaxCount', header: t('gameobjectEditor.fields.loot_max_count'), type: 'number', width: '5rem' },
  { field: 'Comment', header: t('gameobjectEditor.fields.loot_comment'), type: 'text' },
]

function addLoot() {
  store.loot.pushNewEntry({
    Item: 0, Reference: 0, Chance: 100, QuestRequired: false,
    LootMode: 1, GroupId: 0, MinCount: 1, MaxCount: 1, Comment: '',
  })
}

function removeLoot(index: number) {
  store.loot.removeNewEntry(index)
}

// --- Spawn state ---
const spawns = ref<GameObject[]>([])
const spawnsLoading = ref(false)
const editingSpawnGuid = ref<number | null>(null)

async function loadSpawns() {
  if (goEntry.value == null) return
  spawnsLoading.value = true
  try {
    spawns.value = await getGameObjectSpawns(goEntry.value!)
  } catch (e) {
    console.error('Failed to load spawns:', e)
  } finally {
    spawnsLoading.value = false
  }
}

function onEditSpawn(spawn: GameObject) {
  editingSpawnGuid.value = spawn.guid
}

async function onDeleteSpawn(spawn: GameObject) {
  try {
    await deleteGameObjectSpawn(spawn.guid)
    await loadSpawns()
  } catch (e) {
    console.error('Failed to delete spawn:', e)
  }
}

function onSpawnEditorClose() {
  editingSpawnGuid.value = null
  loadSpawns()
}

async function onSpawnEditorSave(data: GameObject) {
  try {
    await saveGameObjectSpawn(data)
    editingSpawnGuid.value = null
    await loadSpawns()
  } catch (e) {
    console.error('Failed to save spawn:', e)
  }
}

// --- Save / Close ---
async function onSave() {
  try {
    await store.saveCurrent()
    store.discardEditor()
    router.push('/gameobject')
  } catch (e) {
    console.error('Failed to save game object:', e)
  }
}

function onClose() {
  store.closeEditor()
  router.push('/gameobject')
}

function onDiscard() {
  store.discardChanges()
}

// --- Load data ---
onMounted(async () => {
  if (store.editorDataLoaded && store.editingEntry === goEntry.value) {
    loadSpawns()
    return
  }

  loading.value = true
  try {
    await store.openEditor(goEntry.value)
  } catch (e) {
    console.error('Failed to load game object:', e)
  } finally {
    loading.value = false
  }

  loadSpawns()
})
</script>

<template>
  <!-- Spawn Editor -->
  <GameObjectSpawnEditor
    v-if="editingSpawnGuid != null"
    :spawnGuid="editingSpawnGuid"
    :goEntry="form.entry"
    @close="onSpawnEditorClose"
    @save="onSpawnEditorSave"
  />

  <div v-else class="go-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="editor-header-left">
        <Button
          icon="pi pi-arrow-left"
          :label="t('gameobjectEditor.back')"
          severity="secondary"
          @click="onClose()"
          class="back-button"
        />
        <h1 class="editor-title">
          {{ t('gameobjectEditor.editorTitle') }} <span v-if="form.name">{{ form.name }}</span> #{{ form.entry }}
        </h1>
      </div>
      <div class="editor-header-right">
        <Button
          icon="pi pi-undo"
          :label="t('gameobjectEditor.discard')"
          @click="onDiscard"
          :disabled="!store.combinedHasChanges"
          class="discard-button"
        />
        <Button
          icon="pi pi-play"
          :label="t('gameobjectEditor.execute')"
          @click="onSave"
          :disabled="!store.combinedHasChanges"
          class="execute-button"
        />
      </div>
    </div>

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
        <Tab value="general">{{ t('gameobjectEditor.tabs.general') }}</Tab>
        <Tab value="data">{{ t('gameobjectEditor.tabs.data') }}</Tab>
        <Tab value="loot">{{ t('gameobjectEditor.tabs.loot') }}</Tab>
        <Tab value="spawn">{{ t('gameobjectEditor.tabs.spawn') }} ({{ spawns.length }})</Tab>
      </TabList>

      <TabPanels>
        <!-- ==================== GENERAL ==================== -->
        <TabPanel value="general">
          <!-- Identification -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('gameobjectEditor.groups.identification') }}</h4>
              <p>{{ t('gameobjectEditor.groups.identificationDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('gameobjectEditor.fields.entry')" :tooltip="t('gameobjectEditor.tooltips.entry')" :modified="isFieldModified('entry')">
                <InputNumber v-model="form.entry" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.name')" :tooltip="t('gameobjectEditor.tooltips.name')" :modified="isFieldModified('name')">
                <InputText v-model="form.name" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.displayId')" :tooltip="t('gameobjectEditor.tooltips.displayId')" :modified="isFieldModified('displayId')">
                <InputNumber v-model="form.displayId" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Basic Information -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('gameobjectEditor.groups.basicInfo') }}</h4>
              <p>{{ t('gameobjectEditor.groups.basicInfoDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('gameobjectEditor.fields.type')" :tooltip="t('gameobjectEditor.tooltips.type')" :modified="isFieldModified('type')">
                <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.size')" :tooltip="t('gameobjectEditor.tooltips.size')" :modified="isFieldModified('size')">
                <InputNumber v-model="form.size" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.IconName')" :modified="isFieldModified('IconName')">
                <InputText v-model="form.IconName" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.castBarCaption')" :modified="isFieldModified('castBarCaption')">
                <InputText v-model="form.castBarCaption" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.unk1')" :modified="isFieldModified('unk1')">
                <InputText v-model="form.unk1" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.AIName')" :modified="isFieldModified('AIName')">
                <InputText v-model="form.AIName" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.ScriptName')" :modified="isFieldModified('ScriptName')">
                <InputText v-model="form.ScriptName" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.StringId')" :modified="isFieldModified('StringId')">
                <InputText v-model="form.StringId" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.VerifiedBuild')" :modified="isFieldModified('VerifiedBuild')">
                <InputNumber v-model="form.VerifiedBuild" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Addon -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('gameobjectEditor.groups.addon') }}</h4>
              <p>{{ t('gameobjectEditor.groups.addonDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('gameobjectEditor.fields.addon_faction')" :modified="isAddonModified('faction')">
                <InputNumber v-model="addonForm.faction" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_flags')" :modified="isAddonModified('flags')">
                <InputNumber v-model="addonForm.flags" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_mingold')" :modified="isAddonModified('mingold')">
                <InputNumber v-model="addonForm.mingold" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_maxgold')" :modified="isAddonModified('maxgold')">
                <InputNumber v-model="addonForm.maxgold" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_artkit0')" :modified="isAddonModified('artkit0')">
                <InputNumber v-model="addonForm.artkit0" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_artkit1')" :modified="isAddonModified('artkit1')">
                <InputNumber v-model="addonForm.artkit1" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_artkit2')" :modified="isAddonModified('artkit2')">
                <InputNumber v-model="addonForm.artkit2" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('gameobjectEditor.fields.addon_artkit3')" :modified="isAddonModified('artkit3')">
                <InputNumber v-model="addonForm.artkit3" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== DATA ==================== -->
        <TabPanel value="data">
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('gameobjectEditor.groups.dataFields') }}</h4>
              <p>{{ t('gameobjectEditor.groups.dataFieldsDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField v-for="i in 24" :key="i - 1" :label="`Data${i - 1}`" :modified="isFieldModified(`Data${i - 1}`)">
                <InputNumber v-model="(form as any)[`Data${i - 1}`]" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== LOOT ==================== -->
        <TabPanel value="loot">
          <EditableDataTable
            :entries="lootEntries"
            :columns="lootColumns"
            :hasChanges="lootHasChanges"
            :title="t('gameobjectEditor.groups.loot')"
            :description="t('gameobjectEditor.groups.lootDesc')"
            dataKey="Item"
            showHeaderAdd
            @add="addLoot"
            @remove="removeLoot"
          />
        </TabPanel>

        <!-- ==================== SPAWN ==================== -->
        <TabPanel value="spawn">
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('gameobjectEditor.groups.spawns') }}</h4>
              <p>{{ t('gameobjectEditor.groups.spawnsDesc') }}</p>
            </div>
            <StyledDataTable
              :data="spawns"
              dataKey="guid"
              @edit="onEditSpawn"
              @delete="onDeleteSpawn"
            >
              <Column field="guid" header="GUID" style="width: 6rem" />
              <Column field="map" header="Map" style="width: 5rem" />
              <Column header="Position" style="min-width: 16rem">
                <template #body="{ data }">
                  {{ data.position_x.toFixed(2) }}, {{ data.position_y.toFixed(2) }}, {{ data.position_z.toFixed(2) }}
                </template>
              </Column>
              <Column field="spawntimesecs" header="Spawn Time" style="width: 8rem" />
              <Column header="Actions" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
                <template #body="{ data }">
                  <ActionsColumn :data="data" @edit="onEditSpawn" @delete="onDeleteSpawn" />
                </template>
              </Column>
            </StyledDataTable>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.go-editor {
  max-width: 80rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.25rem !important;
  transition: all 0.2s !important;
}

.back-button:hover {
  background: rgba(51, 65, 85, 0.9) !important;
  border-color: rgba(71, 85, 105, 0.8) !important;
  color: #ffffff !important;
}

.execute-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.execute-button:hover {
  background: linear-gradient(135deg, #22d3ee, #06b6d4) !important;
}

.discard-button {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.discard-button:hover {
  background: linear-gradient(135deg, #f87171, #e75151) !important;
}

.editor-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #22d3ee;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-group {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.field-group-header {
  margin-bottom: 1rem;
}

.field-group-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.25rem 0;
}

.field-group-header p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
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
</style>
