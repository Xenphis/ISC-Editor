<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import { npc_flags, unit_flags_options, unit_flags2_options, dynamicflags_options, type_flags_options, flags_extra_options } from '@/modules/npc/types/defines'
import EditorField from '@/components/EditorField.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified } = useNpcFieldModifiers()

const form = store.formData
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
</template>

<style scoped>
@import '../npc-editor.css';
</style>
