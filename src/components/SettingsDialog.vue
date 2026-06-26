<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import { useDebugStore } from '@/stores/debugStore'
import { useModelPreviewStore } from '@/modules/model_viewer/store'

const { t } = useI18n()
const debug = useDebugStore()
const modelPreview = useModelPreviewStore()

const visible = defineModel<boolean>('visible', { default: false })

const sourceOptions = computed(() => [
  { label: t('modelViewer.settings.sourceOnline'), value: 'online' },
  { label: t('modelViewer.settings.sourceLocal'), value: 'local' },
])

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
    :style="{ width: '28rem' }"
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

    <div class="setting-divider"></div>

    <!-- Model preview source -->
    <div class="setting-block">
      <div class="setting-info">
        <span class="setting-label">{{ t('modelViewer.settings.title') }}</span>
        <p class="setting-desc">{{ t('modelViewer.settings.sourceDesc') }}</p>
      </div>
      <SelectButton
        v-model="modelPreview.source"
        :options="sourceOptions"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
      />

      <div v-if="modelPreview.source === 'local'" class="setting-sub">
        <label class="setting-sublabel">{{ t('modelViewer.settings.localPathLabel') }}</label>
        <InputText
          v-model="modelPreview.localDataPath"
          :placeholder="t('modelViewer.settings.localPathPlaceholder')"
          fluid
        />
        <p class="setting-desc">{{ t('modelViewer.settings.localPathDesc') }}</p>
      </div>
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

.setting-divider {
  height: 1px;
  background: rgba(51, 65, 85, 0.4);
  margin: 1.25rem 0;
}

.setting-block {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.setting-sub {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.setting-sublabel {
  font-size: 0.85rem;
  font-weight: 500;
  color: #cbd5e1;
}
</style>
