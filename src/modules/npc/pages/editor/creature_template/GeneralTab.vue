<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { locale_options } from '@/types/common'
import { pvp_flags_options,rank_options, unit_class_options, type_options, family_options, icon_name } from '@/modules/npc/types/defines'
import EditorField from '@/components/EditorField.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import EditableDataTable, { type ColumnDef } from '@/components/EditableDataTable.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified, isAddonModified } = useNpcFieldModifiers()

const form = store.formData
const addonForm = store.addon.newEntry
const localeEntries = computed(() => store.locales.getNewEntries())

const rankOptions = rank_options.map(o => ({ value: o.value, label: o.name }))
const unitClassOptions = unit_class_options.map(o => ({ value: o.value, label: o.name }))
const typeOptions = type_options.map(o => ({ value: o.value, label: o.name }))
const familyOptions = family_options.map(o => ({ value: o.value, label: o.name }))
const iconOptions = icon_name.map(o => ({ value: o.value, label: o.name }))

const regenHealthOptions = [
  { value: 0, label: 'No' },
  { value: 1, label: 'Yes' },
]

const localeHasChanges = computed(() => store.locales.getSqlDiff(form.entry).length > 0)

const localeSelectOptions = locale_options.map(o => ({ value: o.value, label: `${o.value} — ${o.comment}` }))

const localeColumns: ColumnDef[] = [
  { field: 'locale', header: 'Locale', type: 'select', width: '12rem', options: localeSelectOptions },
  { field: 'Name', header: t('creature_template.fields.locale_name'), type: 'text' },
  { field: 'Title', header: t('creature_template.fields.locale_title'), type: 'text' },
]

function addLocale() {
  store.locales.pushNewEntry({ locale: '', Name: '', Title: null })
}

function removeLocale(index: number) {
  store.locales.removeNewEntry(index)
}
</script>

<template>
  <!-- Identification -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.identification') }}</h4>
      <p>{{ t('creature_template.groups.identificationDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.entry')" :modified="isFieldModified('entry')">
        <InputNumber v-model="form.entry" :useGrouping="false" disabled fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.name')" :modified="isFieldModified('name')">
        <InputText v-model="form.name" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.subname')" :modified="isFieldModified('subname')">
        <InputText v-model="form.subname" fluid />
      </EditorField>
    </div>
  </div>

  <!-- Basic Information -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.basicInfo') }}</h4>
      <p>{{ t('creature_template.groups.basicInfoDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.type')" :modified="isFieldModified('type')">
        <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.unit_class')" :modified="isFieldModified('unit_class')">
        <Select v-model="form.unit_class" :options="unitClassOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.faction')" :modified="isFieldModified('faction')">
        <InputNumber v-model="form.faction" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.rank')" :modified="isFieldModified('rank')">
        <Select v-model="form.rank" :options="rankOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.family')" :modified="isFieldModified('family')">
        <Select v-model="form.family" :options="familyOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.IconName')" :modified="isFieldModified('IconName')">
        <Select v-model="form.IconName" :options="iconOptions" optionLabel="label" optionValue="value" fluid editable />
      </EditorField>
      <EditorField :label="t('creature_template.fields.gossip_menu_id')" :modified="isFieldModified('gossip_menu_id')">
        <InputNumber v-model="form.gossip_menu_id" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.addon_pvpflags')" :modified="isAddonModified('PvPFlags')">
        <BitmaskField v-model="addonForm.PvPFlags" :options="pvp_flags_options" :label="t('creature_template.fields.addon_pvpflags')" />
      </EditorField>
    </div>
  </div>

  <!-- Stats -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.stats') }}</h4>
      <p>{{ t('creature_template.groups.statsDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.minlevel')" :modified="isFieldModified('minlevel')">
        <InputNumber v-model="form.minlevel" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.maxlevel')" :modified="isFieldModified('maxlevel')">
        <InputNumber v-model="form.maxlevel" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.RegenHealth')" :modified="isFieldModified('RegenHealth')">
        <Select v-model="form.RegenHealth" :options="regenHealthOptions" optionLabel="label" optionValue="value" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.HealthModifier')" :modified="isFieldModified('HealthModifier')">
        <InputNumber v-model="form.HealthModifier" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.ManaModifier')" :modified="isFieldModified('ManaModifier')">
        <InputNumber v-model="form.ManaModifier" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.ArmorModifier')" :modified="isFieldModified('ArmorModifier')">
        <InputNumber v-model="form.ArmorModifier" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <!-- Experience & Reputation -->
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.experience') }}</h4>
      <p>{{ t('creature_template.groups.experienceDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.exp')" :modified="isFieldModified('exp')">
        <InputNumber v-model="form.exp" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.ExperienceModifier')" :modified="isFieldModified('ExperienceModifier')">
        <InputNumber v-model="form.ExperienceModifier" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.RacialLeader')" :modified="isFieldModified('RacialLeader')">
        <InputNumber v-model="form.RacialLeader" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <!-- Locales (creature_template_locale) -->
  <EditableDataTable
    :entries="localeEntries"
    :columns="localeColumns"
    :hasChanges="localeHasChanges"
    :title="t('creature_template.groups.locales')"
    :description="t('creature_template.groups.localesDesc')"
    dataKey="locale"
    showHeaderAdd
    @add="addLocale"
    @remove="removeLocale"
  />
</template>

<style scoped>
@import '../npc-editor.css';
</style>
