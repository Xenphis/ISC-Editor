<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useMapModuleStore, generateDiffQuery, generateFullQuery } from '@/modules/map/store'
import { useMapFieldModifiers } from '../useMapFieldModifiers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useMapModuleStore()
const { isFieldModified, changedFields } = useMapFieldModifiers()

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

const isNew = computed(() => route.params.mapId === 'new' || route.name === 'access-requirement-new')

const diffQuery = computed(() => {
  if (!originalValue.value) return ''
  return generateDiffQuery(originalValue.value, form)
})

const fullQuery = computed(() => generateFullQuery(form))

const hasChanges = computed(() => changedFields.value.length > 0)

const difficultyOptions = [
  { value: 0, label: t('access_requirement.difficulty.0') },
  { value: 1, label: t('access_requirement.difficulty.1') },
  { value: 2, label: t('access_requirement.difficulty.2') },
  { value: 3, label: t('access_requirement.difficulty.3') },
  { value: 4, label: t('access_requirement.difficulty.4') },
  { value: 5, label: t('access_requirement.difficulty.5') },
]

async function load() {
  loading.value = true
  try {
    if (isNew.value) {
      store.openNew()
    } else {
      const mapId = Number(route.params.mapId)
      const difficulty = Number(route.params.difficulty)
      await store.openEditor(mapId, difficulty)
    }
  } finally {
    loading.value = false
  }
}

async function onExecute() {
  try {
    await store.saveEntry()
    router.push('/maps/access-requirement')
  } catch (e) {
    console.error('Failed to save access requirement:', e)
  }
}

function onBack() {
  router.push('/maps/access-requirement')
}

function onDiscard() {
  if (!isNew.value && originalValue.value) {
    Object.assign(form, originalValue.value)
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="access-requirement-editor">
    <EditorHeader
      :title="t('access_requirement.editorTitle')"
      :id="isNew ? undefined : `${form.mapId} / ${form.difficulty}`"
      :backLabel="t('access_requirement.title')"
      :executeLabel="t('editor.execute', 'Exécuter')"
      :discardLabel="t('editor.discard', 'Annuler')"
      :hasChanges="hasChanges || isNew"
      @back="onBack"
      @execute="onExecute"
      @discard="onDiscard"
    />

    <SqlQueryPanel
      :diffQuery="diffQuery"
      :fullQuery="fullQuery"
      :hasChanges="hasChanges"
      :changedFields="changedFields"
    />

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner" />
    </div>

    <template v-else>
      <!-- Identification -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('access_requirement.groups.identification') }}</h4>
          <p>{{ t('access_requirement.groups.identificationDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('access_requirement.fields.mapId')">
            <InputNumber v-model="form.mapId" :useGrouping="false" :disabled="!isNew" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.difficulty')">
            <Select
              v-model="form.difficulty"
              :options="difficultyOptions"
              optionLabel="label"
              optionValue="value"
              :disabled="!isNew"
              fluid
            />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.comment')" :modified="isFieldModified('comment')" :fullWidth="true">
            <InputText v-model="form.comment" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Levels -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('access_requirement.groups.levels') }}</h4>
          <p>{{ t('access_requirement.groups.levelsDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('access_requirement.fields.level_min')" :modified="isFieldModified('level_min')">
            <InputNumber v-model="form.level_min" :useGrouping="false" :min="0" :max="80" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.level_max')" :modified="isFieldModified('level_max')">
            <InputNumber v-model="form.level_max" :useGrouping="false" :min="0" :max="80" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Items -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('access_requirement.groups.items') }}</h4>
          <p>{{ t('access_requirement.groups.itemsDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('access_requirement.fields.item')" :modified="isFieldModified('item')">
            <InputNumber v-model="form.item" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.item2')" :modified="isFieldModified('item2')">
            <InputNumber v-model="form.item2" :useGrouping="false" :min="0" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Quests & Achievements -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('access_requirement.groups.quests') }}</h4>
          <p>{{ t('access_requirement.groups.questsDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('access_requirement.fields.quest_done_A')" :modified="isFieldModified('quest_done_A')">
            <InputNumber v-model="form.quest_done_A" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.quest_done_H')" :modified="isFieldModified('quest_done_H')">
            <InputNumber v-model="form.quest_done_H" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.completed_achievement')" :modified="isFieldModified('completed_achievement')">
            <InputNumber v-model="form.completed_achievement" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField :label="t('access_requirement.fields.quest_failed_text')" :modified="isFieldModified('quest_failed_text')" :fullWidth="true">
            <InputText v-model="form.quest_failed_text" fluid />
          </EditorField>
        </div>
      </div>
    </template>
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
</style>
