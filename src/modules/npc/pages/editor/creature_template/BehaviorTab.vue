<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { ground_movement_options, swim_movement_options, flight_movement_options, rooted_options, chase_movement_options, random_movement_options, movement_type_options } from '@/modules/npc/types/defines'
import EditorField from '@core/components/EditorField.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified, isMovementModified, isAddonModified } = useNpcFieldModifiers()

const form = store.formData
const movementForm = store.movement.newEntry
const addonForm = store.addon.newEntry

const groundOptions = ground_movement_options.map(o => ({ value: o.value, label: o.name }))
const swimOptions = swim_movement_options.map(o => ({ value: o.value, label: o.name }))
const flightOptions = flight_movement_options.map(o => ({ value: o.value, label: o.name }))
const rootedOptions = rooted_options.map(o => ({ value: o.value, label: o.name }))
const chaseOptions = chase_movement_options.map(o => ({ value: o.value, label: o.name }))
const randomOptions = random_movement_options.map(o => ({ value: o.value, label: o.name }))

const movementTypeOptions = movement_type_options.map(o => ({ value: o.value, label: o.name }))
</script>

<template>
  <!-- Movement -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.movement') }}</h4>
      <p>{{ t('creature_template.groups.movementDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.movementId')" :modified="isFieldModified('movementId')">
        <InputNumber v-model="form.movementId" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.MovementType')" :modified="isFieldModified('MovementType')">
        <Select v-model="form.MovementType" :options="movementTypeOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.speed_walk')" :modified="isFieldModified('speed_walk')">
        <InputNumber v-model="form.speed_walk" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.speed_run')" :modified="isFieldModified('speed_run')">
        <InputNumber v-model="form.speed_run" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.addon_path_id')" :modified="isAddonModified('path_id')">
        <InputNumber v-model="addonForm.path_id" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <!-- Movement Details (creature_template_movement) -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.movementDetails') }}</h4>
      <p>{{ t('creature_template.groups.movementDetailsDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.movement_ground')" :modified="isMovementModified('Ground')">
        <Select v-model="movementForm.Ground" :options="groundOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_swim')" :modified="isMovementModified('Swim')">
        <Select v-model="movementForm.Swim" :options="swimOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_flight')" :modified="isMovementModified('Flight')">
        <Select v-model="movementForm.Flight" :options="flightOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_rooted')" :modified="isMovementModified('Rooted')">
        <Select v-model="movementForm.Rooted" :options="rootedOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_chase')" :modified="isMovementModified('Chase')">
        <Select v-model="movementForm.Chase" :options="chaseOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_random')" :modified="isMovementModified('Random')">
        <Select v-model="movementForm.Random" :options="randomOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.movement_interaction_pause')" :modified="isMovementModified('InteractionPauseTimer')">
        <InputNumber v-model="movementForm.InteractionPauseTimer" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <!-- AI & Behavior -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.aiBehavior') }}</h4>
      <p>{{ t('creature_template.groups.aiBehaviorDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.AIName')" :modified="isFieldModified('AIName')">
        <InputText v-model="form.AIName" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.ScriptName')" :modified="isFieldModified('ScriptName')">
        <InputText v-model="form.ScriptName" fluid />
      </EditorField>
    </div>
  </div>
</template>

<style scoped>
@import '../npc-editor.css';
</style>
