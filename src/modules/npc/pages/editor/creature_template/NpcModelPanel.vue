<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ViewInfoPanel from '@/components/ViewInfoPanel.vue'
import ModelViewer from '@/modules/model_viewer/components/ModelViewer.vue'

const { t } = useI18n()

defineProps<{
  modelId: number
  scale: number
  name: string
  iconName?: string | null
}>()
</script>

<template>
  <ViewInfoPanel
    :title="t('creature_template.modelPanel.title')"
    :subtitle="name || undefined"
    icon="pi pi-user"
    storageKey="npc.modelPanel"
  >
    <ModelViewer kind="creature" :displayId="modelId" />

    <dl class="npc-model-meta">
      <div class="npc-model-meta-row">
        <dt>{{ t('creature_template.modelPanel.displayId') }}</dt>
        <dd>{{ modelId || t('creature_template.modelPanel.none') }}</dd>
      </div>
      <div class="npc-model-meta-row">
        <dt>{{ t('creature_template.modelPanel.scale') }}</dt>
        <dd>{{ scale ?? t('creature_template.modelPanel.none') }}</dd>
      </div>
      <div class="npc-model-meta-row">
        <dt>{{ t('creature_template.modelPanel.icon') }}</dt>
        <dd>{{ iconName || t('creature_template.modelPanel.none') }}</dd>
      </div>
    </dl>
  </ViewInfoPanel>
</template>

<style scoped>
.npc-model-meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.npc-model-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.npc-model-meta-row dt {
  color: var(--text-muted);
}

.npc-model-meta-row dd {
  margin: 0;
  color: var(--text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>
