<script setup lang="ts">
import { computed } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import EditorField from '@/components/EditorField.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import type { ParamDef, SaiTypeDef, SmartScript } from '../types'

const UINT32_MAX = 4294967295

const props = defineProps<{
  def: SaiTypeDef
  row: SmartScript
  prefix: 'event_param' | 'action_param' | 'target_param'
}>()

const maxIndex = computed(() => {
  switch (props.prefix) {
    case 'event_param': return 4
    case 'action_param': return 6
    default: return 3
  }
})

function fieldName(index: number): keyof SmartScript {
  return `${props.prefix}${index}` as keyof SmartScript
}

function getValue(index: number): number {
  return props.row[fieldName(index)] as number
}

function setValue(index: number, value: number | null) {
  ;(props.row as unknown as Record<string, unknown>)[fieldName(index)] = value ?? 0
}

function selectOptions(param: ParamDef) {
  return (param.options ?? []).map(o => ({ value: o.value as number, label: o.name }))
}

/** Params not declared by the def but holding a nonzero value (data guard). */
const undeclaredParams = computed(() => {
  const declared = new Set(props.def.params.map(p => p.index as number))
  const extras: number[] = []
  for (let i = 1; i <= maxIndex.value; i++) {
    if (!declared.has(i) && getValue(i) !== 0) extras.push(i)
  }
  return extras
})
</script>

<template>
  <div class="sai-params">
    <p v-if="def.params.length === 0 && undeclaredParams.length === 0" class="sai-params-empty">
      No parameters for this type.
    </p>

    <div v-for="param in def.params" :key="param.index" class="sai-param">
      <EditorField :label="param.label" :tooltip="param.help">
        <ToggleSwitch
          v-if="param.kind === 'bool'"
          :modelValue="getValue(param.index) !== 0"
          @update:modelValue="(v: boolean) => setValue(param.index, v ? 1 : 0)"
        />
        <Select
          v-else-if="param.kind === 'enum'"
          :modelValue="getValue(param.index)"
          :options="selectOptions(param)"
          optionLabel="label"
          optionValue="value"
          :editable="false"
          fluid
          @update:modelValue="(v: number) => setValue(param.index, v)"
        />
        <BitmaskField
          v-else-if="param.kind === 'bitmask'"
          :modelValue="getValue(param.index)"
          :options="param.bitmask ?? []"
          :label="param.label"
          @update:modelValue="(v: number) => setValue(param.index, v)"
        />
        <InputNumber
          v-else
          :modelValue="getValue(param.index)"
          :useGrouping="false"
          :min="0"
          :max="UINT32_MAX"
          fluid
          :suffix="param.kind === 'ms' ? ' ms' : param.kind === 'percent' ? ' %' : undefined"
          @update:modelValue="(v: number | null) => setValue(param.index, v)"
        />
      </EditorField>
    </div>

    <div v-if="undeclaredParams.length > 0" class="sai-params-extra">
      <p class="sai-params-extra-label">Unused params with values (kept as-is):</p>
      <div v-for="index in undeclaredParams" :key="index" class="sai-param">
        <EditorField :label="`Param ${index}`">
          <InputNumber
            :modelValue="getValue(index)"
            :useGrouping="false"
            :min="0"
            :max="UINT32_MAX"
            fluid
            @update:modelValue="(v: number | null) => setValue(index, v)"
          />
        </EditorField>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sai-params {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1rem;
}

.sai-params-empty {
  grid-column: 1 / -1;
  color: #64748b;
  font-size: 0.85rem;
  font-style: italic;
  margin: 0;
}

.sai-params-extra {
  grid-column: 1 / -1;
  border-top: 1px dashed rgba(148, 163, 184, 0.25);
  padding-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1rem;
}

.sai-params-extra-label {
  grid-column: 1 / -1;
  color: #fbbf24;
  font-size: 0.8rem;
  margin: 0;
}
</style>
