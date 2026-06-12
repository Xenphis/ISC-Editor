<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useExplorationBasexpStore, generateDiffQuery, generateFullQuery, getChangedFields } from '@/modules/map/stores/exploration_basexp'
import { useTableFieldModifiers } from '../useTableFieldModifiers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useExplorationBasexpStore()
const { isFieldModified, changedFields } = useTableFieldModifiers(store, getChangedFields)

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

const isNew = computed(() => route.name === 'exploration-new')

const diffQuery = computed(() => {
  if (!originalValue.value) return ''
  return generateDiffQuery(originalValue.value, form)
})

const fullQuery = computed(() => generateFullQuery(form))

const hasChanges = computed(() => changedFields.value.length > 0)

async function load() {
  loading.value = true
  try {
    if (isNew.value) {
      store.openNew()
    } else {
      await store.openEditor(Number(route.params.level))
    }
  } finally {
    loading.value = false
  }
}

async function onExecute() {
  try {
    await store.saveEntry()
    router.push('/maps/exploration')
  } catch (e) {
    console.error('Failed to save exploration basexp:', e)
  }
}

function onBack() {
  router.push('/maps/exploration')
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
  <div class="map-editor">
    <EditorHeader
      :title="t('exploration_basexp.editorTitle')"
      :id="isNew ? undefined : `${form.level}`"
      :backLabel="t('exploration_basexp.title')"
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
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('exploration_basexp.groups.main') }}</h4>
          <p>{{ t('exploration_basexp.groups.mainDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('exploration_basexp.fields.level')">
            <InputNumber v-model="form.level" :useGrouping="false" :min="0" :max="255" :disabled="!isNew" fluid />
          </EditorField>
          <EditorField :label="t('exploration_basexp.fields.basexp')" :modified="isFieldModified('basexp')">
            <InputNumber v-model="form.basexp" :useGrouping="false" :min="0" fluid />
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
