<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'

const { t } = useI18n()

defineProps<{
  title: string
  description: string
  searchPlaceholder?: string
  addButtonLabel?: string
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'update:search', value: string): void
}>()

const searchQuery = ref('')

function onSearchInput(val: string) {
  searchQuery.value = val
  emit('update:search', val)
}
</script>

<template>
  <div class="module-layout">
    <!-- Header -->
    <div class="module-header">
      <div>
        <h2 class="module-title">{{ title }}</h2>
        <p class="module-description">{{ description }}</p>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="module-actions">
      <div class="search-wrapper">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            :modelValue="searchQuery"
            :placeholder="searchPlaceholder || t('common.search')"
            fluid
            @update:modelValue="onSearchInput($event as string)"
          />
        </IconField>
      </div>
      <Button
        :label="t('common.filter')"
        icon="pi pi-filter"
        severity="secondary"
        class="filter-btn"
      />
      <Button
        v-if="addButtonLabel"
        :label="addButtonLabel"
        icon="pi pi-plus"
        class="add-btn"
        @click="emit('add')"
      />
    </div>

    <!-- Content slot (table, etc.) -->
    <slot />
  </div>
</template>

<style scoped>
.module-layout {
  max-width: 100%;
}

.module-header {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.module-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.module-description {
  color: #94a3b8;
  font-size: 0.95rem;
}

.module-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-wrapper {
  flex: 1;
  min-width: 300px;
}

.filter-btn {
  background: rgba(30, 41, 59, 0.5) !important;
  border: 1px solid rgba(51, 65, 85, 0.5) !important;
  color: #cbd5e1 !important;
}

.filter-btn:hover {
  background: rgba(51, 65, 85, 0.5) !important;
  color: white !important;
}

.add-btn {
  background: linear-gradient(to right, #2563eb, #06b6d4) !important;
  border: none !important;
  font-weight: 500 !important;
}

.add-btn:hover {
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3) !important;
}

/* Dark theme search input */
.search-wrapper :deep(.p-inputtext) {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(51, 65, 85, 0.5) !important;
  color: #e2e8f0 !important;
}

.search-wrapper :deep(.p-inputtext:focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.1) !important;
}

.search-wrapper :deep(.p-inputtext::placeholder) {
  color: rgba(148, 163, 184, 0.5) !important;
}

.search-wrapper :deep(.p-icon) {
  color: #94a3b8 !important;
}
</style>
