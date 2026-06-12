<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useGameTeleStore, generateDiffQuery, generateFullQuery, getChangedFields } from '@/modules/map/stores/game_tele'
import { useTableFieldModifiers } from '../useTableFieldModifiers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGameTeleStore()
const { isFieldModified, changedFields } = useTableFieldModifiers(store, getChangedFields)

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

const isNew = computed(() => route.name === 'game-tele-new')

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
      await store.openEditor(Number(route.params.id))
    }
  } finally {
    loading.value = false
  }
}

async function onExecute() {
  try {
    await store.saveEntry()
    router.push('/maps/teleport')
  } catch (e) {
    console.error('Failed to save game tele:', e)
  }
}

function onBack() {
  router.push('/maps/teleport')
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
      :title="t('game_tele.editorTitle')"
      :id="isNew ? undefined : `${form.id}`"
      :backLabel="t('game_tele.title')"
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
          <h4>{{ t('game_tele.groups.identification') }}</h4>
          <p>{{ t('game_tele.groups.identificationDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('game_tele.fields.id')">
            <InputNumber v-model="form.id" :useGrouping="false" :min="0" :disabled="!isNew" fluid />
          </EditorField>
          <EditorField :label="t('game_tele.fields.name')" :modified="isFieldModified('name')" :fullWidth="true">
            <InputText v-model="form.name" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Position -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('game_tele.groups.position') }}</h4>
          <p>{{ t('game_tele.groups.positionDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField :label="t('game_tele.fields.map')" :modified="isFieldModified('map')">
            <InputNumber v-model="form.map" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField :label="t('game_tele.fields.position_x')" :modified="isFieldModified('position_x')">
            <InputNumber v-model="form.position_x" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
          </EditorField>
          <EditorField :label="t('game_tele.fields.position_y')" :modified="isFieldModified('position_y')">
            <InputNumber v-model="form.position_y" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
          </EditorField>
          <EditorField :label="t('game_tele.fields.position_z')" :modified="isFieldModified('position_z')">
            <InputNumber v-model="form.position_z" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
          </EditorField>
          <EditorField :label="t('game_tele.fields.orientation')" :modified="isFieldModified('orientation')">
            <InputNumber v-model="form.orientation" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
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
