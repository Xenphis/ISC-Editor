<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Message from 'primevue/message'
import SaiEditor from '@/modules/smart_scripts/components/SaiEditor.vue'
import { useNpcModuleStore } from '@/modules/npc/store'

const { t } = useI18n()
const store = useNpcModuleStore()

const aiNameConflict = computed(() => {
  const aiName = store.formData.AIName ?? ''
  return aiName !== '' && aiName !== 'SmartAI'
})

const scriptNameSet = computed(() => (store.formData.ScriptName ?? '') !== '')

const hasRows = computed(() => store.smartScripts.getNewEntries().length > 0)

const aiNameNotSmart = computed(() => hasRows.value && (store.formData.AIName ?? '') !== 'SmartAI')
</script>

<template>
  <div class="sai-tab">
    <Message v-if="aiNameConflict" severity="warn" :closable="false">
      {{ t('creature_template.smart_ai.aiNameConflict', { aiName: store.formData.AIName }) }}
    </Message>
    <Message v-if="scriptNameSet" severity="warn" :closable="false">
      {{ t('creature_template.smart_ai.scriptNameConflict', { scriptName: store.formData.ScriptName }) }}
    </Message>
    <Message v-if="aiNameNotSmart" severity="info" :closable="false">
      {{ t('creature_template.smart_ai.aiNameWillBeSet') }}
    </Message>

    <SaiEditor :ownerName="store.formData.name || String(store.formData.entry)" />
  </div>
</template>

<style scoped>
.sai-tab {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
