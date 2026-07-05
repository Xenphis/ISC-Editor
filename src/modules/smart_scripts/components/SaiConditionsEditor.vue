<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import EditorField from '@/components/EditorField.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import type { ParamDef, SaiCondition, SmartScript } from '../types'
import { condition_target_options, createDefaultCondition } from '../types'
import { conditionTypeOptions, getConditionDef } from '../defs/conditions'

const UINT32_MAX = 4294967295

const { t } = useI18n()
const store = useNpcModuleStore()

const props = defineProps<{
  row: SmartScript
}>()

const conditions = computed(() => store.saiConditions.getForRow(props.row))

const elseGroups = computed(() => {
  const byGroup = new Map<number, SaiCondition[]>()
  for (const condition of conditions.value) {
    const list = byGroup.get(condition.ElseGroup)
    if (list) {
      list.push(condition)
    } else {
      byGroup.set(condition.ElseGroup, [condition])
    }
  }
  return [...byGroup.entries()].sort((a, b) => a[0] - b[0])
})

const targetOptions = condition_target_options.map(o => ({ value: o.value as number, label: o.name }))

function typeOptionsFor(condition: SaiCondition) {
  const known = conditionTypeOptions.some(o => o.value === condition.ConditionTypeOrReference)
  if (known) return conditionTypeOptions
  return [
    ...conditionTypeOptions,
    { value: condition.ConditionTypeOrReference, label: `${condition.ConditionTypeOrReference} — Unknown` },
  ]
}

function defFor(condition: SaiCondition) {
  return getConditionDef(condition.ConditionTypeOrReference)
}

function valueField(index: number): 'ConditionValue1' | 'ConditionValue2' | 'ConditionValue3' {
  return `ConditionValue${index}` as 'ConditionValue1' | 'ConditionValue2' | 'ConditionValue3'
}

function onTypeChange(condition: SaiCondition, type: number) {
  condition.ConditionTypeOrReference = type
  const def = getConditionDef(type)
  for (let i = 1; i <= 3; i++) {
    const param = def.params.find(p => p.index === i)
    condition[valueField(i)] = param?.default ?? 0
  }
}

function selectOptions(param: ParamDef) {
  return (param.options ?? []).map(o => ({ value: o.value as number, label: o.name }))
}

function addCondition(elseGroup: number) {
  store.saiConditions.addCondition(createDefaultCondition(props.row, elseGroup))
}

function addOrGroup() {
  const groups = elseGroups.value
  const lastGroup = groups.length > 0 ? groups[groups.length - 1]![0] : -1
  addCondition(lastGroup + 1)
}

function removeCondition(condition: SaiCondition) {
  store.saiConditions.removeCondition(condition)
}
</script>

<template>
  <div class="sai-conditions">
    <p v-if="conditions.length === 0" class="sai-conditions-empty">
      {{ t('creature_template.smart_ai.conditions.empty') }}
    </p>

    <template v-for="([elseGroup, groupConditions], groupIndex) in elseGroups" :key="elseGroup">
      <div v-if="groupIndex > 0" class="sai-conditions-or">{{ t('creature_template.smart_ai.conditions.or') }}</div>

      <div class="sai-condition-group">
        <div class="sai-condition-group-header">
          <span>{{ t('creature_template.smart_ai.conditions.groupLabel', { n: groupIndex + 1 }) }}</span>
          <Button
            icon="pi pi-plus"
            text
            size="small"
            :label="t('creature_template.smart_ai.conditions.addAnd')"
            @click="addCondition(elseGroup)"
          />
        </div>

        <div v-for="condition in groupConditions" :key="`${condition.ElseGroup}-${groupConditions.indexOf(condition)}`" class="sai-condition">
          <div class="sai-condition-main">
            <EditorField :label="t('creature_template.smart_ai.conditions.type')" :tooltip="defFor(condition).help">
              <Select
                :modelValue="condition.ConditionTypeOrReference"
                :options="typeOptionsFor(condition)"
                optionLabel="label"
                optionValue="value"
                filter
                fluid
                @update:modelValue="(v: number) => onTypeChange(condition, v)"
              />
            </EditorField>
            <EditorField :label="t('creature_template.smart_ai.conditions.target')">
              <Select
                v-model="condition.ConditionTarget"
                :options="targetOptions"
                optionLabel="label"
                optionValue="value"
                fluid
              />
            </EditorField>
            <div class="sai-condition-not">
              <ToggleSwitch
                :modelValue="condition.NegativeCondition !== 0"
                @update:modelValue="(v: boolean) => { condition.NegativeCondition = v ? 1 : 0 }"
              />
              <span>{{ t('creature_template.smart_ai.conditions.negate') }}</span>
            </div>
            <Button
              icon="pi pi-trash"
              text
              size="small"
              severity="danger"
              class="sai-condition-remove"
              @click="removeCondition(condition)"
            />
          </div>

          <div v-if="defFor(condition).params.length > 0" class="sai-condition-params">
            <EditorField
              v-for="param in defFor(condition).params"
              :key="param.index"
              :label="param.label"
              :tooltip="param.help"
            >
              <ToggleSwitch
                v-if="param.kind === 'bool'"
                :modelValue="condition[valueField(param.index)] !== 0"
                @update:modelValue="(v: boolean) => { condition[valueField(param.index)] = v ? 1 : 0 }"
              />
              <Select
                v-else-if="param.kind === 'enum'"
                :modelValue="condition[valueField(param.index)]"
                :options="selectOptions(param)"
                optionLabel="label"
                optionValue="value"
                fluid
                @update:modelValue="(v: number) => { condition[valueField(param.index)] = v }"
              />
              <InputNumber
                v-else
                :modelValue="condition[valueField(param.index)]"
                :useGrouping="false"
                :min="0"
                :max="UINT32_MAX"
                fluid
                @update:modelValue="(v: number | null) => { condition[valueField(param.index)] = v ?? 0 }"
              />
            </EditorField>
          </div>
        </div>
      </div>
    </template>

    <Button
      icon="pi pi-plus"
      text
      size="small"
      :label="conditions.length === 0
        ? t('creature_template.smart_ai.conditions.addFirst')
        : t('creature_template.smart_ai.conditions.addOr')"
      @click="addOrGroup"
    />
  </div>
</template>

<style scoped>
.sai-conditions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sai-conditions-empty {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  font-style: italic;
}

.sai-conditions-or {
  text-align: center;
  color: #f9a8d4;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.sai-condition-group {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.sai-condition-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sai-condition {
  border-top: 1px dashed rgba(148, 163, 184, 0.15);
  padding-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sai-condition:first-of-type {
  border-top: none;
  padding-top: 0;
}

.sai-condition-main {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 0.6rem;
  align-items: end;
}

.sai-condition-not {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #94a3b8;
  font-size: 0.78rem;
  padding-bottom: 0.55rem;
}

.sai-condition-remove {
  margin-bottom: 0.3rem;
}

.sai-condition-params {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem 0.8rem;
}
</style>
