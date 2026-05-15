<script setup lang="ts">
import Button from 'primevue/button'

withDefaults(defineProps<{
  title?: string
  subtitle?: string
  id?: string | number
  backLabel?: string
  hasChanges?: boolean
  showDiscard?: boolean
  showExecute?: boolean
  executeLabel?: string
  discardLabel?: string
}>(), {
  showDiscard: true,
  showExecute: true,
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'discard'): void
  (e: 'execute'): void
}>()
</script>

<template>
  <div class="editor-header">
    <div class="editor-header-left">
      <Button
        icon="pi pi-arrow-left"
        :label="backLabel"
        severity="secondary"
        @click="emit('back')"
        class="back-button"
      />
      <h1 v-if="title || subtitle || id != null" class="editor-title">
        <span v-if="title">{{ title }}</span>
        <span v-if="subtitle" class="editor-subtitle">{{ subtitle }}</span>
        <span v-if="id != null" class="editor-id">#{{ id }}</span>
      </h1>
    </div>
    <div class="editor-header-right">
      <Button
        v-if="showDiscard !== false"
        icon="pi pi-undo"
        :label="discardLabel"
        @click="emit('discard')"
        :disabled="!hasChanges"
        class="discard-button"
      />
      <Button
        v-if="showExecute !== false"
        icon="pi pi-play"
        :label="executeLabel"
        @click="emit('execute')"
        :disabled="!hasChanges"
        class="execute-button"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor-title {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-subtitle {
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.editor-id {
  font-size: 1.4rem;
  background: none;
  -webkit-text-fill-color: #94a3b8;
  color: #94a3b8;
}

</style>

<style>
.editor-header .back-button.p-button {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.25rem !important;
  transition: all 0.2s !important;
  flex-shrink: 0;
}

.editor-header .back-button.p-button:hover {
  background: rgba(51, 65, 85, 0.9) !important;
  border-color: rgba(71, 85, 105, 0.8) !important;
  color: #ffffff !important;
}

.editor-header .execute-button.p-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.editor-header .execute-button.p-button:hover {
  background: linear-gradient(135deg, #22d3ee, #06b6d4) !important;
}

.editor-header .discard-button.p-button {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.editor-header .discard-button.p-button:hover {
  background: linear-gradient(135deg, #f87171, #e75151) !important;
}
</style>
