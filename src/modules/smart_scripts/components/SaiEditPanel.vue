<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Drawer from 'primevue/drawer'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import EditorField from '@/components/EditorField.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import SaiParamFields from './SaiParamFields.vue'
import SaiConditionsEditor from './SaiConditionsEditor.vue'
import type { SmartScript } from '../types'
import { SAI_EVENT_LINK, SAI_SOURCE_TYPE_TIMED_ACTIONLIST } from '../types'
import {
  actionTypeOptions,
  event_flags_options,
  event_phase_options,
  eventTypeOptions,
  getActionDef,
  getEventDef,
  getTargetDef,
  targetTypeOptions,
} from '../defs'
import { buildComment, summarizeRow } from '../summarize'

const { t } = useI18n()

const props = defineProps<{
  row: SmartScript | null
  ownerName: string
  /** True when the row is a linked child (event type is locked to 61) */
  isLinked?: boolean
}>()

const visible = defineModel<boolean>('visible', { required: true })

const isActionlistRow = computed(() => props.row?.source_type === SAI_SOURCE_TYPE_TIMED_ACTIONLIST)

const eventDef = computed(() => props.row ? getEventDef(props.row.event_type) : null)
const actionDef = computed(() => props.row ? getActionDef(props.row.action_type) : null)
const targetDef = computed(() => props.row ? getTargetDef(props.row.target_type) : null)

const summary = computed(() => props.row ? summarizeRow(props.row) : null)

// Auto comment: enabled while the stored comment matches the generated one
const autoComment = ref(true)

watch(() => props.row, (row) => {
  if (!row) return
  autoComment.value = row.comment === '' || row.comment === buildComment(props.ownerName, row)
}, { immediate: true })

watch(
  () => props.row ? summarizeRow(props.row).full + props.row.event_type + props.row.action_type : '',
  () => {
    if (props.row && autoComment.value) {
      props.row.comment = buildComment(props.ownerName, props.row)
    }
  },
)

function onAutoCommentToggle(value: boolean) {
  autoComment.value = value
  if (value && props.row) {
    props.row.comment = buildComment(props.ownerName, props.row)
  }
}

function resetParams(row: SmartScript, prefix: 'event_param' | 'action_param' | 'target_param', count: number, defParams: { index: number, default?: number }[]) {
  for (let i = 1; i <= count; i++) {
    const def = defParams.find(p => p.index === i)
    ;(row as unknown as Record<string, unknown>)[`${prefix}${i}`] = def?.default ?? 0
  }
}

function onEventTypeChange(value: number) {
  if (!props.row) return
  props.row.event_type = value
  resetParams(props.row, 'event_param', 4, getEventDef(value).params)
}

function onActionTypeChange(value: number) {
  if (!props.row) return
  props.row.action_type = value
  resetParams(props.row, 'action_param', 6, getActionDef(value).params)
}

function onTargetTypeChange(value: number) {
  if (!props.row) return
  props.row.target_type = value
  resetParams(props.row, 'target_param', 3, getTargetDef(value).params)
  if (!getTargetDef(value).usesCoords) {
    props.row.target_x = 0
    props.row.target_y = 0
    props.row.target_z = 0
    props.row.target_o = 0
  }
}

const eventOptions = eventTypeOptions.map(o => ({ value: o.value, label: o.label }))
const actionOptions = actionTypeOptions.map(o => ({ value: o.value, label: o.label }))
const targetOptions = targetTypeOptions.map(o => ({ value: o.value, label: o.label }))
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="right"
    class="sai-drawer"
    :style="{ width: '34rem' }"
    :header="t('creature_template.smart_ai.editRow')"
  >
    <div v-if="row" class="sai-panel">
      <p v-if="summary" class="sai-panel-summary">{{ summary.full }}</p>

      <!-- Event -->
      <section class="sai-section">
        <h4>{{ t('creature_template.smart_ai.sections.event') }}</h4>
        <template v-if="isActionlistRow">
          <p class="sai-section-hint">{{ t('creature_template.smart_ai.actionlistWaitHint') }}</p>
          <div class="sai-grid">
            <EditorField label="Wait min">
              <InputNumber :useGrouping="false" :min="0" suffix=" ms" fluid v-model="row.event_param1" />
            </EditorField>
            <EditorField label="Wait max">
              <InputNumber :useGrouping="false" :min="0" suffix=" ms" fluid v-model="row.event_param2" />
            </EditorField>
          </div>
        </template>
        <template v-else>
          <EditorField
            :label="t('creature_template.smart_ai.fields.eventType')"
            :tooltip="eventDef?.help"
          >
            <Select
              :modelValue="row.event_type"
              :options="eventOptions"
              optionLabel="label"
              optionValue="value"
              filter
              :disabled="isLinked || row.event_type === SAI_EVENT_LINK"
              fluid
              @update:modelValue="onEventTypeChange"
            />
          </EditorField>
          <SaiParamFields v-if="eventDef" :def="eventDef" :row="row" prefix="event_param" />
          <div class="sai-grid sai-event-meta">
            <EditorField :label="t('creature_template.smart_ai.fields.chance')">
              <InputNumber v-model="row.event_chance" :useGrouping="false" :min="0" :max="100" suffix=" %" fluid />
            </EditorField>
            <BitmaskField
              v-model="row.event_phase_mask"
              :options="event_phase_options"
              :label="t('creature_template.smart_ai.fields.phaseMask')"
            />
            <BitmaskField
              v-model="row.event_flags"
              :options="event_flags_options"
              :label="t('creature_template.smart_ai.fields.eventFlags')"
            />
          </div>
        </template>
      </section>

      <!-- Action -->
      <section class="sai-section">
        <h4>{{ t('creature_template.smart_ai.sections.action') }}</h4>
        <EditorField
          :label="t('creature_template.smart_ai.fields.actionType')"
          :tooltip="actionDef?.help"
        >
          <Select
            :modelValue="row.action_type"
            :options="actionOptions"
            optionLabel="label"
            optionValue="value"
            filter
            fluid
            @update:modelValue="onActionTypeChange"
          />
        </EditorField>
        <SaiParamFields v-if="actionDef" :def="actionDef" :row="row" prefix="action_param" />
      </section>

      <!-- Target -->
      <section class="sai-section">
        <h4>{{ t('creature_template.smart_ai.sections.target') }}</h4>
        <EditorField
          :label="t('creature_template.smart_ai.fields.targetType')"
          :tooltip="targetDef?.help"
        >
          <Select
            :modelValue="row.target_type"
            :options="targetOptions"
            optionLabel="label"
            optionValue="value"
            filter
            fluid
            @update:modelValue="onTargetTypeChange"
          />
        </EditorField>
        <SaiParamFields v-if="targetDef" :def="targetDef" :row="row" prefix="target_param" />
        <div v-if="targetDef?.usesCoords" class="sai-grid sai-coords">
          <EditorField label="X"><InputNumber v-model="row.target_x" :maxFractionDigits="4" fluid /></EditorField>
          <EditorField label="Y"><InputNumber v-model="row.target_y" :maxFractionDigits="4" fluid /></EditorField>
          <EditorField label="Z"><InputNumber v-model="row.target_z" :maxFractionDigits="4" fluid /></EditorField>
          <EditorField label="O"><InputNumber v-model="row.target_o" :maxFractionDigits="4" fluid /></EditorField>
        </div>
      </section>

      <!-- Conditions -->
      <section class="sai-section">
        <h4>{{ t('creature_template.smart_ai.sections.conditions') }}</h4>
        <p class="sai-section-hint">{{ t('creature_template.smart_ai.conditions.hint') }}</p>
        <SaiConditionsEditor :row="row" />
      </section>

      <!-- Comment -->
      <section class="sai-section">
        <h4>{{ t('creature_template.smart_ai.sections.comment') }}</h4>
        <div class="sai-comment-row">
          <InputText v-model="row.comment" :disabled="autoComment" fluid />
          <div class="sai-comment-toggle">
            <ToggleSwitch :modelValue="autoComment" @update:modelValue="onAutoCommentToggle" />
            <span>{{ t('creature_template.smart_ai.autoComment') }}</span>
          </div>
        </div>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.sai-panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sai-panel-summary {
  margin: 0;
  padding: 0.6rem 0.8rem;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 6px;
  color: #a5f3fc;
  font-size: 0.85rem;
}

.sai-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 8px;
  padding: 0.9rem;
  background: rgba(15, 23, 42, 0.5);
}

.sai-section h4 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #22d3ee;
}

.sai-section-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 0.8rem;
}

.sai-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1rem;
}

.sai-coords {
  grid-template-columns: repeat(4, 1fr);
}

.sai-event-meta {
  grid-template-columns: repeat(3, 1fr);
}

.sai-comment-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sai-comment-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.8rem;
}
</style>
