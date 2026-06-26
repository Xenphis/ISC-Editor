<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ViewInfoPanel from '@/components/ViewInfoPanel.vue'
import ModelViewer from '@/modules/model_viewer/components/ModelViewer.vue'

const { t } = useI18n()

defineProps<{
  displayId: number
  size: number
  name: string
}>()
</script>

<template>
  <ViewInfoPanel
    :title="t('gameobjectEditor.modelPanel.title')"
    :subtitle="name || undefined"
    icon="pi pi-box"
    storageKey="gameobject.modelPanel"
  >
    <ModelViewer kind="gameobject" :displayId="displayId" />

    <dl class="go-model-meta">
      <div class="go-model-meta-row">
        <dt>{{ t('gameobjectEditor.modelPanel.displayId') }}</dt>
        <dd>{{ displayId || t('gameobjectEditor.modelPanel.none') }}</dd>
      </div>
      <div class="go-model-meta-row">
        <dt>{{ t('gameobjectEditor.modelPanel.size') }}</dt>
        <dd>{{ size ?? t('gameobjectEditor.modelPanel.none') }}</dd>
      </div>
    </dl>
  </ViewInfoPanel>
</template>

<style scoped>
.go-model-meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.go-model-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.go-model-meta-row dt {
  color: var(--text-muted);
}

.go-model-meta-row dd {
  margin: 0;
  color: var(--text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>
