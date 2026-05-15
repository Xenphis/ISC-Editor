<script setup lang="ts" generic="T extends Record<string, any>">
import DataTable from 'primevue/datatable'

defineProps<{
  data: T[]
  dataKey: string
  rows?: number
}>()
</script>

<template>
  <DataTable
    :value="data"
    :dataKey="dataKey"
    :rows="rows ?? 20"
    stripedRows
    class="styled-datatable"
  >
    <slot />
  </DataTable>
</template>

<style scoped>
.styled-datatable {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  overflow: hidden;
}

:deep(.p-datatable-table-container) {
  border-radius: 0.75rem;
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  background: rgba(30, 41, 59, 0.5) !important;
  border-color: rgba(51, 65, 85, 0.5) !important;
  color: #cbd5e1 !important;
  font-weight: 600;
  font-size: 0.875rem;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  border-color: rgba(51, 65, 85, 0.3) !important;
}

:deep(.p-datatable-tbody > tr:hover) {
  background: rgba(51, 65, 85, 0.2) !important;
}

:deep(.p-datatable-tbody > tr > td) {
  border-color: rgba(51, 65, 85, 0.3) !important;
  color: #e2e8f0;
  font-size: 0.875rem;
}

:deep(.p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background: rgba(15, 23, 42, 0.2) !important;
}
</style>
