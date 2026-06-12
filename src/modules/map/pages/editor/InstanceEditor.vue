<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import EditableDataTable, { type ColumnDef } from '@/components/EditableDataTable.vue'
import { useInstanceStore } from '@/modules/map/stores/instance'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useInstanceStore()

const loading = ref(false)
const template = store.template

const isNew = computed(() => route.name === 'instance-new')

const diffQuery = computed(() => store.diffQueryText())
const hasChanges = computed(() => store.hasChanges())
const changedFields = computed(() => store.changedFields())

const spawnGroupColumns = computed<ColumnDef[]>(() => [
  { field: 'instanceMapId', header: t('instance_spawn_groups.fields.instanceMapId'), type: 'number', width: '9rem' },
  { field: 'bossStateId', header: t('instance_spawn_groups.fields.bossStateId'), type: 'number', width: '8rem' },
  { field: 'bossStates', header: t('instance_spawn_groups.fields.bossStates'), type: 'number', width: '8rem' },
  { field: 'spawnGroupId', header: t('instance_spawn_groups.fields.spawnGroupId'), type: 'number', width: '9rem' },
  { field: 'flags', header: t('instance_spawn_groups.fields.flags'), type: 'number', width: '7rem' },
])

const encounterColumns = computed<ColumnDef[]>(() => [
  { field: 'entry', header: t('instance_encounters.fields.entry'), type: 'number', width: '8rem' },
  { field: 'creditType', header: t('instance_encounters.fields.creditType'), type: 'number', width: '8rem' },
  { field: 'creditEntry', header: t('instance_encounters.fields.creditEntry'), type: 'number', width: '9rem' },
  { field: 'lastEncounterDungeon', header: t('instance_encounters.fields.lastEncounterDungeon'), type: 'number', width: '11rem' },
  { field: 'comment', header: t('instance_encounters.fields.comment'), type: 'text' },
])

async function load() {
  loading.value = true
  try {
    if (isNew.value) {
      store.openNew()
    } else {
      await store.openEditor(Number(route.params.map))
    }
  } finally {
    loading.value = false
  }
}

async function onExecute() {
  try {
    await store.saveEntry()
    router.push('/maps/instances')
  } catch (e) {
    console.error('Failed to save instance:', e)
  }
}

function onBack() {
  router.push('/maps/instances')
}

function onDiscard() {
  load()
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="map-editor">
    <EditorHeader
      :title="t('instance.editorTitle')"
      :id="isNew ? undefined : `${template.map}`"
      :backLabel="t('instance.title')"
      :executeLabel="t('editor.execute', 'Exécuter')"
      :discardLabel="t('editor.discard', 'Annuler')"
      :hasChanges="hasChanges || isNew"
      @back="onBack"
      @execute="onExecute"
      @discard="onDiscard"
    />

    <SqlQueryPanel
      :diffQuery="diffQuery"
      :fullQuery="diffQuery"
      :hasChanges="hasChanges"
      :changedFields="changedFields"
    />

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <Tabs v-else value="template">
      <TabList>
        <Tab value="template">{{ t('instance.tabs.template') }}</Tab>
        <Tab value="spawnGroups">{{ t('instance.tabs.spawnGroups') }}</Tab>
        <Tab value="encounters">{{ t('instance.tabs.encounters') }}</Tab>
      </TabList>

      <TabPanels>
        <!-- ==================== TEMPLATE ==================== -->
        <TabPanel value="template">
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('instance_template.groups.main') }}</h4>
              <p>{{ t('instance_template.groups.mainDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('instance_template.fields.map')">
                <InputNumber v-model="template.map" :useGrouping="false" :min="0" :disabled="!isNew" fluid />
              </EditorField>
              <EditorField :label="t('instance_template.fields.parent')">
                <InputNumber v-model="template.parent" :useGrouping="false" :min="0" fluid />
              </EditorField>
              <EditorField :label="t('instance_template.fields.allowMount')">
                <InputNumber v-model="template.allowMount" :useGrouping="false" :min="0" :max="1" fluid />
              </EditorField>
              <EditorField :label="t('instance_template.fields.script')" :fullWidth="true">
                <InputText v-model="template.script" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== SPAWN GROUPS ==================== -->
        <TabPanel value="spawnGroups">
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('instance.groups.spawnGroups') }}</h4>
              <p>{{ t('instance.groups.spawnGroupsDesc') }}</p>
            </div>
            <EditableDataTable
              :entries="store.spawnGroups"
              :columns="spawnGroupColumns"
              dataKey="_uid"
              :addLabel="t('instance.addSpawnGroup')"
              embedded
              @add="store.addSpawnGroup()"
              @remove="store.removeSpawnGroup($event)"
            />
          </div>
        </TabPanel>

        <!-- ==================== ENCOUNTERS ==================== -->
        <TabPanel value="encounters">
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('instance.groups.encounters') }}</h4>
              <p>{{ t('instance.groups.encountersDesc') }}</p>
            </div>
            <div class="encounters-hint">
              <i class="pi pi-info-circle" />
              <span>{{ t('instance.encountersHint') }}</span>
            </div>
            <EditableDataTable
              :entries="store.encounters"
              :columns="encounterColumns"
              dataKey="_uid"
              :addLabel="t('instance.addEncounter')"
              embedded
              @add="store.addEncounter()"
              @remove="store.removeEncounter($event)"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
@import './map-editor.css';

.loading-state {
  display: flex;
  justify-content: center;
  padding: 4rem;
  font-size: 1.5rem;
  color: #64748b;
}

.encounters-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #94a3b8;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  margin-bottom: 1rem;
}

.encounters-hint .pi {
  color: #22d3ee;
  font-size: 0.9rem;
}
</style>
