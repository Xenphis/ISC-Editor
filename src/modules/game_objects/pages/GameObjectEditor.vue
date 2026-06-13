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
import GameObjectLocaleTab from './GameObjectLocaleTab.vue'
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

// --- Quest relations ---
const questStarterEntries = computed(() => store.questStarters.getNewEntries())
const questEnderEntries = computed(() => store.questEnders.getNewEntries())
const questStartersHasChanges = computed(() => store.questStarters.getSqlDiff(form.entry).length > 0)
const questEndersHasChanges = computed(() => store.questEnders.getSqlDiff(form.entry).length > 0)

function addQuestStarter() {
  store.questStarters.pushNewEntry({ id: form.entry, quest: 0 })
}
function removeQuestStarter(index: number) {
  store.questStarters.removeNewEntry(index)
}
function addQuestEnder() {
  store.questEnders.pushNewEntry({ id: form.entry, quest: 0 })
}
function removeQuestEnder(index: number) {
  store.questEnders.removeNewEntry(index)
}

// --- Quest items (gameobject_questitem) ---
const MAX_QUEST_ITEMS = 6
const questItemEntries = computed(() => store.questItems.getNewEntries())
const questItemHasChanges = computed(() => store.questItems.getSqlDiff(form.entry).length > 0)

const questItemColumns: ColumnDef[] = [
  { field: 'Idx', header: t('gameobjectEditor.fields.questItem_idx'), type: 'readonly', width: '5rem' },
  { field: 'ItemId', header: t('gameobjectEditor.fields.questItem_itemId'), type: 'number' },
]

function addQuestItem() {
  if (questItemEntries.value.length >= MAX_QUEST_ITEMS) return
  const usedIdx = new Set(questItemEntries.value.map(e => e.Idx))
  let nextIdx = 0
  while (usedIdx.has(nextIdx) && nextIdx < MAX_QUEST_ITEMS) nextIdx++
  if (nextIdx >= MAX_QUEST_ITEMS) return
  store.questItems.pushNewEntry({ Idx: nextIdx, ItemId: 0 })
}

function removeQuestItem(index: number) {
  store.questItems.removeNewEntry(index)
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
        <Tab value="locale">{{ t('gameobjectEditor.tabs.locale') }}</Tab>
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

        <!-- ==================== LOOT & QUESTS ==================== -->
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

          <EditableDataTable
            :entries="questItemEntries"
            :columns="questItemColumns"
            :hasChanges="questItemHasChanges"
            :title="t('gameobjectEditor.groups.questItems')"
            :description="t('gameobjectEditor.groups.questItemsDesc')"
            dataKey="Idx"
            showHeaderAdd
            @add="addQuestItem"
            @remove="removeQuestItem"
          />

          <div class="field-group" :class="{ 'field-group-modified': questStartersHasChanges || questEndersHasChanges }">
            <div class="field-group-header">
              <h4>{{ t('gameobject_quests.sectionTitle') }}</h4>
            </div>
            <div class="quest-rel-grid">
              <div class="quest-rel-col">
                <div class="quest-col-title">{{ t('gameobject_quests.starters') }}</div>
                <div class="quest-col-desc">{{ t('gameobject_quests.startersDesc') }}</div>
                <div v-if="questStarterEntries.length === 0" class="qrel-empty">{{ t('gameobject_quests.empty') }}</div>
                <div v-for="(entry, idx) in questStarterEntries" :key="idx" class="qrel-row">
                  <span class="qrel-tag">{{ t('gameobject_quests.quest') }}</span>
                  <InputNumber v-model="entry.quest" :useGrouping="false" :min="0" :placeholder="t('gameobject_quests.questPlaceholder')" fluid />
                  <Button icon="pi pi-trash" severity="danger" text size="small" @click="removeQuestStarter(idx)" />
                </div>
                <div class="qrel-add-row">
                  <Button icon="pi pi-plus" :label="t('gameobject_quests.add')" severity="secondary" size="small" @click="addQuestStarter" />
                </div>
              </div>
              <div class="quest-rel-col">
                <div class="quest-col-title">{{ t('gameobject_quests.enders') }}</div>
                <div class="quest-col-desc">{{ t('gameobject_quests.endersDesc') }}</div>
                <div v-if="questEnderEntries.length === 0" class="qrel-empty">{{ t('gameobject_quests.empty') }}</div>
                <div v-for="(entry, idx) in questEnderEntries" :key="idx" class="qrel-row">
                  <span class="qrel-tag">{{ t('gameobject_quests.quest') }}</span>
                  <InputNumber v-model="entry.quest" :useGrouping="false" :min="0" :placeholder="t('gameobject_quests.questPlaceholder')" fluid />
                  <Button icon="pi pi-trash" severity="danger" text size="small" @click="removeQuestEnder(idx)" />
                </div>
                <div class="qrel-add-row">
                  <Button icon="pi pi-plus" :label="t('gameobject_quests.add')" severity="secondary" size="small" @click="addQuestEnder" />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== LOCALE ==================== -->
        <TabPanel value="locale">
          <GameObjectLocaleTab />
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

.qrel-empty {
  color: #64748b;
  font-size: 0.875rem;
  padding: 0.75rem 0;
  text-align: center;
}

.qrel-row {
  display: grid;
  grid-template-columns: 6rem 1fr 2.5rem;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.qrel-tag {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.qrel-add-row {
  margin-top: 0.5rem;
}

.field-group-modified {
  border-color: rgba(6, 182, 212, 0.4);
}

.quest-rel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.quest-col-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--p-text-color);
  margin-bottom: 0.25rem;
}

.quest-col-desc {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.75rem;
}
</style>
