<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { npc_flags, unit_flags_options, unit_flags2_options, dynamicflags_options, type_flags_options, flags_extra_options } from '@/modules/npc/types/defines'
import EditorField from '@core/components/EditorField.vue'
import BitmaskField from '@core/components/BitmaskField.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified, isOnKillRepModified } = useNpcFieldModifiers()

const form = store.formData
const repForm = store.onKillRep.newEntry

const maxStandingOptions = [
  { label: 'Hated (0)',      value: 0 },
  { label: 'Hostile (1)',    value: 1 },
  { label: 'Unfriendly (2)', value: 2 },
  { label: 'Neutral (3)',    value: 3 },
  { label: 'Friendly (4)',   value: 4 },
  { label: 'Honored (5)',    value: 5 },
  { label: 'Revered (6)',    value: 6 },
  { label: 'Exalted (7)',    value: 7 },
]
</script>

<template>
  <!-- Flags -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.flags') }}</h4>
      <p>{{ t('creature_template.groups.flagsDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.npcflag')" :modified="isFieldModified('npcflag')">
        <BitmaskField v-model="form.npcflag" :options="npc_flags" :label="t('creature_template.fields.npcflag')" />
      </EditorField>
      <EditorField :label="t('creature_template.fields.unit_flags')" :modified="isFieldModified('unit_flags')">
        <BitmaskField v-model="form.unit_flags" :options="unit_flags_options" :label="t('creature_template.fields.unit_flags')" />
      </EditorField>
      <EditorField :label="t('creature_template.fields.unit_flags2')" :modified="isFieldModified('unit_flags2')">
        <BitmaskField v-model="form.unit_flags2" :options="unit_flags2_options" :label="t('creature_template.fields.unit_flags2')" />
      </EditorField>
      <EditorField :label="t('creature_template.fields.dynamicflags')" :modified="isFieldModified('dynamicflags')">
        <BitmaskField v-model="form.dynamicflags" :options="dynamicflags_options" :label="t('creature_template.fields.dynamicflags')" />
      </EditorField>
      <EditorField :label="t('creature_template.fields.type_flags')" :modified="isFieldModified('type_flags')">
        <BitmaskField v-model="form.type_flags" :options="type_flags_options" :label="t('creature_template.fields.type_flags')" />
      </EditorField>
      <EditorField :label="t('creature_template.fields.flags_extra')" :modified="isFieldModified('flags_extra')">
        <BitmaskField v-model="form.flags_extra" :options="flags_extra_options" :label="t('creature_template.fields.flags_extra')" />
      </EditorField>
    </div>
  </div>

  <!-- Miscellaneous -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.miscAdvanced') }}</h4>
      <p>{{ t('creature_template.groups.miscAdvancedDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.HoverHeight')" :modified="isFieldModified('HoverHeight')">
        <InputNumber v-model="form.HoverHeight" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.PetSpellDataId')" :modified="isFieldModified('PetSpellDataId')">
        <InputNumber v-model="form.PetSpellDataId" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.StringId')" :modified="isFieldModified('StringId')">
        <InputText v-model="form.StringId" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.VerifiedBuild')" :modified="isFieldModified('VerifiedBuild')">
        <InputNumber v-model="form.VerifiedBuild" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <!-- Réputations -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.reputations') }}</h4>
      <p>{{ t('creature_template.groups.reputationsDesc') }}</p>
    </div>
    <div class="field-grid field-grid-4">
      <!-- Faction 1 -->
      <EditorField :label="t('creature_template.fields.RewOnKillRepFaction1')" :modified="isOnKillRepModified('RewOnKillRepFaction1')">
        <InputNumber v-model="repForm.RewOnKillRepFaction1" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.RewOnKillRepValue1')" :modified="isOnKillRepModified('RewOnKillRepValue1')">
        <InputNumber v-model="repForm.RewOnKillRepValue1" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.MaxStanding1')" :modified="isOnKillRepModified('MaxStanding1')">
        <Select v-model="repForm.MaxStanding1" :options="maxStandingOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.IsTeamAward1')" :modified="isOnKillRepModified('IsTeamAward1')">
        <InputNumber v-model="repForm.IsTeamAward1" :min="0" :max="1" :useGrouping="false" fluid />
      </EditorField>
      <!-- Faction 2 -->
      <EditorField :label="t('creature_template.fields.RewOnKillRepFaction2')" :modified="isOnKillRepModified('RewOnKillRepFaction2')">
        <InputNumber v-model="repForm.RewOnKillRepFaction2" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.RewOnKillRepValue2')" :modified="isOnKillRepModified('RewOnKillRepValue2')">
        <InputNumber v-model="repForm.RewOnKillRepValue2" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.MaxStanding2')" :modified="isOnKillRepModified('MaxStanding2')">
        <Select v-model="repForm.MaxStanding2" :options="maxStandingOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.IsTeamAward2')" :modified="isOnKillRepModified('IsTeamAward2')">
        <InputNumber v-model="repForm.IsTeamAward2" :min="0" :max="1" :useGrouping="false" fluid />
      </EditorField>
      <!-- Team Dependent -->
      <EditorField :label="t('creature_template.fields.TeamDependent')" :modified="isOnKillRepModified('TeamDependent')">
        <InputNumber v-model="repForm.TeamDependent" :min="0" :max="1" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>
</template>

<style scoped>
@import '../npc-editor.css';

.field-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}
</style>
