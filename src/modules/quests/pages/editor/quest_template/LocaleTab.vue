<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { locale_options } from '@/types/common'
import { useQuestModuleStore } from '@/modules/quests/store'

const { t } = useI18n()
const store = useQuestModuleStore()
const form = store.formData

const localeEntries = computed(() => store.locales.getNewEntries())
const localeHasChanges = computed(() => store.locales.getSqlDiff(form.ID).length > 0)

const localeSelectOptions = locale_options.map(o => ({ value: o.value, label: `${o.value} — ${o.comment}` }))

function addLocale() {
  store.locales.pushNewEntry({
    locale: '',
    Title: null,
    Details: null,
    Objectives: null,
    EndText: null,
    CompletedText: null,
    ObjectiveText1: null,
    ObjectiveText2: null,
    ObjectiveText3: null,
    ObjectiveText4: null,
  })
}

function removeLocale(index: number) {
  store.locales.removeNewEntry(index)
}
</script>

<template>
  <div class="tab-content">
    <div class="field-group" :class="{ 'field-group-modified': localeHasChanges }">
      <div class="field-group-header">
        <h4>{{ t('quest_template.groups.locales') }}</h4>
        <p>{{ t('quest_template.groups.localesDesc') }}</p>
      </div>

      <div v-if="localeEntries.length === 0" class="locale-empty">
        <span>{{ t('quest_template.fields.locale') }}</span>
      </div>

      <div v-for="(entry, idx) in localeEntries" :key="idx" class="locale-entry">
        <div class="locale-entry-header">
          <span class="locale-tag">{{ entry.locale || '?' }}</span>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            size="small"
            @click="removeLocale(idx)"
          />
        </div>
        <div class="locale-fields">
          <div class="locale-row">
            <div class="locale-select-field">
              <label>{{ t('quest_template.fields.locale') }}</label>
              <Select
                v-model="entry.locale"
                :options="localeSelectOptions"
                optionValue="value"
                optionLabel="label"
                fluid
              />
            </div>
            <div class="locale-field">
              <label>{{ t('quest_template.fields.locale_title') }}</label>
              <InputText v-model="entry.Title" fluid />
            </div>
          </div>
          <div class="locale-row">
            <div class="locale-field">
              <label>{{ t('quest_template.fields.locale_details') }}</label>
              <InputText v-model="entry.Details" fluid />
            </div>
            <div class="locale-field">
              <label>{{ t('quest_template.fields.locale_objectives') }}</label>
              <InputText v-model="entry.Objectives" fluid />
            </div>
          </div>
          <div class="locale-row">
            <div class="locale-field">
              <label>{{ t('quest_template.fields.locale_endtext') }}</label>
              <InputText v-model="entry.EndText" fluid />
            </div>
            <div class="locale-field">
              <label>{{ t('quest_template.fields.locale_completedtext') }}</label>
              <InputText v-model="entry.CompletedText" fluid />
            </div>
          </div>
          <div class="locale-row locale-row-4">
            <div v-for="i in 4" :key="i" class="locale-field">
              <label>{{ t(`quest_template.fields.locale_objectivetext${i}`) }}</label>
              <InputText v-model="(entry as any)[`ObjectiveText${i}`]" fluid />
            </div>
          </div>
        </div>
      </div>

      <div class="locale-add-row">
        <Button
          icon="pi pi-plus"
          :label="t('quest_template.fields.locale')"
          severity="secondary"
          size="small"
          @click="addLocale"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './quest-editor.css';

.locale-empty {
  color: #64748b;
  font-size: 0.875rem;
  padding: 1rem 0;
  text-align: center;
}

.locale-entry {
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
}

.locale-entry-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.locale-tag {
  font-weight: 600;
  font-size: 0.9rem;
  color: #22d3ee;
  background: rgba(6, 182, 212, 0.1);
  padding: 0.15rem 0.6rem;
  border-radius: 4px;
}

.locale-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.locale-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.locale-row-4 {
  grid-template-columns: 1fr 1fr 1fr 1fr;
}

.locale-select-field,
.locale-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.locale-select-field label,
.locale-field label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.locale-add-row {
  margin-top: 0.75rem;
}

.field-group-modified {
  border-color: rgba(6, 182, 212, 0.4);
}
</style>
