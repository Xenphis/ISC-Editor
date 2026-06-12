<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ViewInfoPanel from '@/components/ViewInfoPanel.vue'

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
    <!-- Render placeholder — a real model viewer will be mounted here later -->
    <div class="npc-model-preview">
      <i class="pi pi-user npc-model-preview-icon"></i>
      <span class="npc-model-preview-label">{{ t('creature_template.modelPanel.placeholder') }}</span>
    </div>

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
.npc-model-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  aspect-ratio: 3 / 4;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(6, 182, 212, 0.08), transparent 70%),
    var(--surface-input);
  border: 1px dashed var(--border-input);
  border-radius: 0.5rem;
  color: var(--text-muted);
  text-align: center;
  padding: 1rem;
}

.npc-model-preview-icon {
  font-size: 3rem;
  color: var(--text-placeholder);
}

.npc-model-preview-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

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
