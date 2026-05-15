<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import EditorField from '@/components/EditorField.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import { useQuestModuleStore } from '@/modules/quests/store'
import { quest_flags_options } from '@/modules/quests/types/quest_template'

const { t } = useI18n()
const store = useQuestModuleStore()
const form = store.formData
const orig = computed(() => store.originalValue)

function isModified(field: keyof typeof form): boolean {
  if (!orig.value) return false
  return (orig.value as any)[field] !== (form as any)[field]
}

const questTypeOptions = [
  { value: 0, label: t('quest.types.0') },
  { value: 1, label: t('quest.types.1') },
  { value: 2, label: t('quest.types.2') },
  { value: 3, label: t('quest.types.3') },
]
</script>

<template>
  <div class="tab-content">
    <!-- Identification -->
    <div class="field-group">
      <div class="field-group-header">
        <h4>{{ t('quest_template.groups.identification') }}</h4>
        <p>{{ t('quest_template.groups.identificationDesc') }}</p>
      </div>
      <div class="field-grid">
        <EditorField :label="t('quest_template.fields.ID')" :modified="isModified('ID')">
          <InputNumber v-model="form.ID" :useGrouping="false" disabled fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.QuestType')" :modified="isModified('QuestType')">
          <Select v-model="form.QuestType" :options="questTypeOptions" optionValue="value" optionLabel="label" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.StartItem')" :modified="isModified('StartItem')">
          <InputNumber v-model="form.StartItem" :useGrouping="false" fluid />
        </EditorField>
      </div>
    </div>

    <!-- Parameters -->
    <div class="field-group">
      <div class="field-group-header">
        <h4>{{ t('quest_template.groups.parameters') }}</h4>
        <p>{{ t('quest_template.groups.parametersDesc') }}</p>
      </div>
      <div class="field-grid">
        <EditorField :label="t('quest_template.fields.QuestLevel')" :modified="isModified('QuestLevel')">
          <InputNumber v-model="form.QuestLevel" :useGrouping="false" :min="-1" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.MinLevel')" :modified="isModified('MinLevel')">
          <InputNumber v-model="form.MinLevel" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.SuggestedGroupNum')" :modified="isModified('SuggestedGroupNum')">
          <InputNumber v-model="form.SuggestedGroupNum" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.QuestSortID')" :modified="isModified('QuestSortID')">
          <InputNumber v-model="form.QuestSortID" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.QuestInfoID')" :modified="isModified('QuestInfoID')">
          <InputNumber v-model="form.QuestInfoID" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.TimeAllowed')" :modified="isModified('TimeAllowed')">
          <InputNumber v-model="form.TimeAllowed" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.AllowableRaces')" :modified="isModified('AllowableRaces')">
          <InputNumber v-model="form.AllowableRaces" :useGrouping="false" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.RewardNextQuest')" :modified="isModified('RewardNextQuest')">
          <InputNumber v-model="form.RewardNextQuest" :useGrouping="false" fluid />
        </EditorField>
      </div>
    </div>

    <!-- Flags -->
    <div class="field-group">
      <div class="field-group-header">
        <h4>{{ t('quest_template.groups.flags') }}</h4>
        <p>{{ t('quest_template.groups.flagsDesc') }}</p>
      </div>
      <div class="field-grid">
        <EditorField :label="t('quest_template.fields.Flags')" :modified="isModified('Flags')" :fullWidth="true">
          <BitmaskField
            v-model="form.Flags"
            :options="quest_flags_options"
            :label="t('quest_template.fields.Flags')"
          />
        </EditorField>
      </div>
    </div>

    <!-- Texts -->
    <div class="field-group">
      <div class="field-group-header">
        <h4>{{ t('quest_template.groups.texts') }}</h4>
        <p>{{ t('quest_template.groups.textsDesc') }}</p>
      </div>
      <div class="field-grid">
        <EditorField :label="t('quest_template.fields.LogTitle')" :modified="isModified('LogTitle')" :fullWidth="true">
          <InputText v-model="form.LogTitle" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.LogDescription')" :modified="isModified('LogDescription')" :fullWidth="true">
          <Textarea v-model="form.LogDescription" rows="3" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.QuestDescription')" :modified="isModified('QuestDescription')" :fullWidth="true">
          <Textarea v-model="form.QuestDescription" rows="4" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.AreaDescription')" :modified="isModified('AreaDescription')" :fullWidth="true">
          <InputText v-model="form.AreaDescription" fluid />
        </EditorField>
        <EditorField :label="t('quest_template.fields.QuestCompletionLog')" :modified="isModified('QuestCompletionLog')" :fullWidth="true">
          <Textarea v-model="form.QuestCompletionLog" rows="2" fluid />
        </EditorField>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './quest-editor.css';
</style>
