<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import { useDebugStore } from '@/stores/debugStore'

const { t } = useI18n()
const debug = useDebugStore()

const visible = defineModel<boolean>('visible', { default: false })

function onToggleDebug(value: boolean) {
  debug.setEnabled(value)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="t('settings.title')"
    modal
    :closable="true"
    :draggable="false"
    :style="{ width: '24rem' }"
    :pt="{
      root: { style: 'background: #0f172a; border: 1px solid rgba(51,65,85,0.6); border-radius: 0.75rem; overflow: hidden;' },
      header: { style: 'background: #0f172a; border-bottom: 1px solid rgba(51,65,85,0.4); padding: 1.25rem 1.5rem; color: #e2e8f0;' },
      content: { style: 'background: #0f172a; padding: 1.5rem;' },
      headerActions: { style: 'color: #94a3b8;' },
      mask: { style: 'background: rgba(0,0,0,0.6);' },
    }"
  >
    <div class="setting-row">
      <div class="setting-info">
        <span class="setting-label">{{ t('settings.sqlDebug') }}</span>
        <p class="setting-desc">{{ t('settings.sqlDebugDesc') }}</p>
      </div>
      <ToggleSwitch
        :modelValue="debug.enabled"
        @update:modelValue="onToggleDebug"
      />
    </div>
  </Dialog>
</template>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-weight: 500;
  color: #e2e8f0;
  font-size: 0.95rem;
}

.setting-desc {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.4;
}
</style>
