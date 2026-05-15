<script setup lang="ts">
defineProps<{
  label: string
  tooltip?: string
  modified?: boolean
  fullWidth?: boolean
}>()
</script>

<template>
  <div class="field" :class="{ 'field-modified': modified, 'full-width': fullWidth }">
    <label>
      {{ label }}
      <i 
        v-if="tooltip" 
        class="pi pi-question-circle" 
        v-tooltip.top="tooltip"
      ></i>
    </label>
    <slot />
  </div>
</template>

<style scoped>
.field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #cbd5e1;
  margin-bottom: 0.5rem;
}

.field label i {
  font-size: 0.8rem;
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s;
}

.field label i:hover {
  color: #cbd5e1;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field.field-modified {
  position: relative;
}

.field.field-modified label {
  color: #22d3ee;
}

.field.field-modified::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #22d3ee;
  border-radius: 2px;
}

.field.field-modified :deep(.p-inputtext),
.field.field-modified :deep(.p-inputnumber-input),
.field.field-modified :deep(.p-select) {
  border-color: rgba(6, 182, 212, 0.4) !important;
  background: rgba(6, 182, 212, 0.05) !important;
}
</style>
