<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import type { BitmaskOption } from '@/types/common'

const { t } = useI18n()

const props = defineProps<{
  modelValue: number
  options: BitmaskOption[]
  label: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const dialogVisible = ref(false)
const localValue = ref(0)

function openDialog() {
  localValue.value = props.modelValue ?? 0
  dialogVisible.value = true
}

function isFlagActive(flag: number): boolean {
  return (localValue.value & flag) !== 0
}

function toggleFlag(flag: number, active: boolean) {
  if (active) {
    localValue.value = localValue.value | flag
  } else {
    localValue.value = localValue.value & ~flag
  }
}

function onDone() {
  emit('update:modelValue', localValue.value)
  dialogVisible.value = false
}

</script>

<template>
  <div class="bitmask-field">
    <div class="bitmask-input-wrapper">
      <InputNumber
        :modelValue="modelValue"
        :useGrouping="false"
        readonly
        fluid
        class="bitmask-input"
      />
      <Button
        label="..."
        class="bitmask-browse-btn"
        severity="secondary"
        @click="openDialog"
      />
    </div>

    <Dialog
      v-model:visible="dialogVisible"
      :header="label"
      modal
      :closable="true"
      :draggable="false"
      :style="{ width: '36rem' }"
      :pt="{
        root: { style: 'background: #0f172a; border: 1px solid rgba(51,65,85,0.6); border-radius: 0.75rem; overflow: hidden;' },
        header: { style: 'background: #0f172a; border-bottom: 1px solid rgba(51,65,85,0.4); padding: 1.25rem 1.5rem;' },
        content: { style: 'background: #0f172a; padding: 0;' },
        footer: { style: 'background: #0f172a; border-top: 1px solid rgba(51,65,85,0.4); padding: 1rem 1.5rem;' },
        headerActions: { style: 'color: #94a3b8;' },
        mask: { style: 'background: rgba(0,0,0,0.6);' },
      }"
    >
      <template #header>
        <div class="bitmask-dialog-header">
          <span class="bitmask-dialog-title">{{ label }}</span>
          <span class="bitmask-dialog-value">
            {{ t('bitmaskField.currentValue') }} <span class="value-number">{{ localValue }}</span>
          </span>
        </div>
      </template>

      <div class="bitmask-options-list">
        <div
          v-for="option in options"
          :key="option.value"
          class="bitmask-option"
          :class="{ 'bitmask-option-active': isFlagActive(option.value) }"
        >
          <ToggleSwitch
            :modelValue="isFlagActive(option.value)"
            @update:modelValue="(val: boolean) => toggleFlag(option.value, val)"
          />
          <div class="bitmask-option-info">
            <div class="bitmask-option-header">
              <span class="bitmask-option-name">{{ option.name }}</span>
              <span class="bitmask-option-hex">{{ option.hex }}</span>
            </div>
            <p v-if="option.comment" class="bitmask-option-comment">{{ option.comment }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="bitmask-dialog-footer">
          <Button
            :label="t('bitmaskField.done')"
            @click="onDone"
            class="bitmask-done-btn"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.bitmask-input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  height: 2.6rem;
}

.bitmask-input {
  flex: 1;
  height: 100%;
}

.bitmask-input :deep(.p-inputnumber) {
  height: 100%;
}

.bitmask-input :deep(.p-inputnumber-input) {
  cursor: default;
  height: 100%;
}

.bitmask-browse-btn {
  min-width: 2.6rem !important;
  width: 2.6rem !important;
  height: 100% !important;
  padding: 0 !important;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.1em;
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #94a3b8 !important;
}

.bitmask-browse-btn:hover {
  background: rgba(51, 65, 85, 0.8) !important;
  color: #e2e8f0 !important;
  border-color: rgba(6, 182, 212, 0.5) !important;
}

.bitmask-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bitmask-dialog-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #e2e8f0;
}

.bitmask-dialog-value {
  font-size: 0.85rem;
  color: #94a3b8;
}

.bitmask-dialog-value .value-number {
  color: #22d3ee;
  font-weight: 600;
}

/* Options list */
.bitmask-options-list {
  max-height: 28rem;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.bitmask-options-list::-webkit-scrollbar {
  width: 6px;
}

.bitmask-options-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.bitmask-options-list::-webkit-scrollbar-thumb {
  background: rgba(51, 65, 85, 0.8);
  border-radius: 3px;
}

.bitmask-options-list::-webkit-scrollbar-thumb:hover {
  background: rgba(71, 85, 105, 0.9);
}

.bitmask-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.2);
  transition: background 0.15s ease;
}

.bitmask-option:last-child {
  border-bottom: none;
}

.bitmask-option:hover {
  background: rgba(30, 41, 59, 0.4);
}

.bitmask-option-active {
  background: rgba(6, 182, 212, 0.05);
}

.bitmask-option-active:hover {
  background: rgba(6, 182, 212, 0.08);
}

.bitmask-option :deep(.p-toggleswitch) {
  margin-top: 0.15rem;
  flex-shrink: 0;
}

/* ToggleSwitch OFF state styling */
.bitmask-option :deep(.p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-slider) {
  background: rgba(51, 65, 85, 0.8) !important;
  border: 1px solid rgba(71, 85, 105, 0.8) !important;
}

.bitmask-option :deep(.p-toggleswitch:not(.p-toggleswitch-checked) .p-toggleswitch-slider:hover) {
  background: rgba(71, 85, 105, 0.9) !important;
  border-color: rgba(100, 116, 139, 0.9) !important;
}

/* ToggleSwitch ON state styling - bleu ciel clair */
.bitmask-option :deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
  background: linear-gradient(135deg, #06b6d4, #22d3ee) !important;
  border: 1px solid #22d3ee !important;
}

.bitmask-option :deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider:hover) {
  background: linear-gradient(135deg, #22d3ee, #67e8f9) !important;
  border-color: #67e8f9 !important;
}

.bitmask-option-info {
  flex: 1;
  min-width: 0;
}

.bitmask-option-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.bitmask-option-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
}

.bitmask-option-hex {
  font-size: 0.8rem;
  color: #64748b;
  font-family: monospace;
}

.bitmask-option-comment {
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
}

/* Footer */
.bitmask-dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.bitmask-done-btn {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.5rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.bitmask-done-btn:hover {
  background: linear-gradient(135deg, #22d3ee, #06b6d4) !important;
}
</style>
