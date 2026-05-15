<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import InputNumber from 'primevue/inputnumber'
import EditorField from '@/components/EditorField.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified } = useNpcFieldModifiers()

const form = store.formData
</script>

<template>
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.lootConfig') }}</h4>
      <p>{{ t('creature_template.groups.lootConfigDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.lootid')" :modified="isFieldModified('lootid')">
        <InputNumber v-model="form.lootid" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.pickpocketloot')" :modified="isFieldModified('pickpocketloot')">
        <InputNumber v-model="form.pickpocketloot" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.skinloot')" :modified="isFieldModified('skinloot')">
        <InputNumber v-model="form.skinloot" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.mingold')" :modified="isFieldModified('mingold')">
        <InputNumber v-model="form.mingold" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.maxgold')" :modified="isFieldModified('maxgold')">
        <InputNumber v-model="form.maxgold" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>
</template>

<style scoped>
@import '../npc-editor.css';
</style>
