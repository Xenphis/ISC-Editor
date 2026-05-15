<script setup lang="ts">
import Button from 'primevue/button'

withDefaults(defineProps<{
  data: any
  showEdit?: boolean
  showDelete?: boolean
}>(), {
  showEdit: true,
  showDelete: true,
})

const emit = defineEmits<{
  (e: 'edit', item: any): void
  (e: 'delete', item: any): void
}>()
</script>

<template>
  <div class="action-buttons">
    <Button
      v-if="showEdit !== false"
      icon="pi pi-pencil"
      severity="info"
      text
      rounded
      class="action-edit"
      @click="emit('edit', data)"
    />
    <Button
      v-if="showDelete !== false"
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      class="action-delete"
      @click="emit('delete', data)"
    />
  </div>
</template>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
}

.action-edit {
  color: #60a5fa !important;
}

.action-edit:hover {
  background: rgba(96, 165, 250, 0.1) !important;
}

.action-delete {
  color: #f87171 !important;
}

.action-delete:hover {
  background: rgba(248, 113, 113, 0.1) !important;
}
</style>
