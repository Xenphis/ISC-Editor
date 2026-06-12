<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import {
  useCreatureClassLevelStatsStore,
  generateDiffQuery,
  generateFullQuery,
} from '@/modules/npc/stores/creatureClassLevelStatsStore'
import { useClassLevelStatsFieldModifiers } from '../../useClassLevelStatsFieldModifiers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useCreatureClassLevelStatsStore()
const { isFieldModified, changedFields } = useClassLevelStatsFieldModifiers()

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

const classLabel = computed(() => {
  const id = form.class
  return t(`creature_classlevelstats.classes.${id}`)
})

const diffQuery = computed(() => {
  if (!originalValue.value) return ''
  return generateDiffQuery(originalValue.value, form)
})

const fullQuery = computed(() => generateFullQuery(form))

const hasChanges = computed(() => changedFields.value.length > 0)

async function load() {
  loading.value = true
  try {
    const level = Number(route.params.level)
    const classId = Number(route.params.classId)
    await store.openEditor(level, classId)
  } finally {
    loading.value = false
  }
}

async function onExecute() {
  try {
    await store.saveEntry()
    router.push('/npc/creature-classlevelstats')
  } catch (e) {
    console.error('Failed to save creature_classlevelstat:', e)
  }
}

function onBack() {
  router.push('/npc/creature-classlevelstats')
}

function onDiscard() {
  if (originalValue.value) {
    Object.assign(form, originalValue.value)
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="classlevelstats-editor">
    <EditorHeader
      :title="t('creature_classlevelstats.editorTitle')"
      :subtitle="classLabel"
      :id="form.level"
      :backLabel="t('creature_classlevelstats.title')"
      :executeLabel="t('editor.execute', 'Exécuter')"
      :discardLabel="t('editor.discard', 'Annuler')"
      :hasChanges="hasChanges"
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

    <template v-else-if="store.editorDataLoaded">
      <!-- Health -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('creature_classlevelstats.groups.health') }}</h4>
          <p>{{ t('creature_classlevelstats.groups.healthDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField
            :label="t('creature_classlevelstats.fields.basehp0')"
            :modified="isFieldModified('basehp0')"
            :tooltip="t('creature_classlevelstats.tooltips.basehp0')"
          >
            <InputNumber v-model="form.basehp0" :useGrouping="false" :min="1" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.basehp1')"
            :modified="isFieldModified('basehp1')"
            :tooltip="t('creature_classlevelstats.tooltips.basehp1')"
          >
            <InputNumber v-model="form.basehp1" :useGrouping="false" :min="1" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.basehp2')"
            :modified="isFieldModified('basehp2')"
            :tooltip="t('creature_classlevelstats.tooltips.basehp2')"
          >
            <InputNumber v-model="form.basehp2" :useGrouping="false" :min="1" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Resources -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('creature_classlevelstats.groups.resources') }}</h4>
          <p>{{ t('creature_classlevelstats.groups.resourcesDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField
            :label="t('creature_classlevelstats.fields.basemana')"
            :modified="isFieldModified('basemana')"
          >
            <InputNumber v-model="form.basemana" :useGrouping="false" :min="1" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.basearmor')"
            :modified="isFieldModified('basearmor')"
          >
            <InputNumber v-model="form.basearmor" :useGrouping="false" :min="1" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Attack Power -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('creature_classlevelstats.groups.attack') }}</h4>
          <p>{{ t('creature_classlevelstats.groups.attackDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField
            :label="t('creature_classlevelstats.fields.attackpower')"
            :modified="isFieldModified('attackpower')"
            :tooltip="t('creature_classlevelstats.tooltips.attackpower')"
          >
            <InputNumber v-model="form.attackpower" :useGrouping="false" :min="0" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.rangedattackpower')"
            :modified="isFieldModified('rangedattackpower')"
            :tooltip="t('creature_classlevelstats.tooltips.rangedattackpower')"
          >
            <InputNumber v-model="form.rangedattackpower" :useGrouping="false" :min="0" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Damage -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('creature_classlevelstats.groups.damage') }}</h4>
          <p>{{ t('creature_classlevelstats.groups.damageDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField
            :label="t('creature_classlevelstats.fields.damage_base')"
            :modified="isFieldModified('damage_base')"
            :tooltip="t('creature_classlevelstats.tooltips.damage_base')"
          >
            <InputNumber v-model="form.damage_base" :minFractionDigits="2" :maxFractionDigits="6" :min="0" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.damage_exp1')"
            :modified="isFieldModified('damage_exp1')"
            :tooltip="t('creature_classlevelstats.tooltips.damage_exp1')"
          >
            <InputNumber v-model="form.damage_exp1" :minFractionDigits="2" :maxFractionDigits="6" :min="0" fluid />
          </EditorField>
          <EditorField
            :label="t('creature_classlevelstats.fields.damage_exp2')"
            :modified="isFieldModified('damage_exp2')"
            :tooltip="t('creature_classlevelstats.tooltips.damage_exp2')"
          >
            <InputNumber v-model="form.damage_exp2" :minFractionDigits="2" :maxFractionDigits="6" :min="0" fluid />
          </EditorField>
        </div>
      </div>

      <!-- Misc -->
      <div class="field-group">
        <div class="field-group-header">
          <h4>{{ t('creature_classlevelstats.groups.misc') }}</h4>
          <p>{{ t('creature_classlevelstats.groups.miscDesc') }}</p>
        </div>
        <div class="field-grid">
          <EditorField
            :label="t('creature_classlevelstats.fields.comment')"
            :modified="isFieldModified('comment')"
            :fullWidth="true"
          >
            <InputText v-model="form.comment" fluid />
          </EditorField>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@import '../npc-editor.css';


.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 12rem;
  color: #64748b;
  font-size: 1.5rem;
}

</style>
