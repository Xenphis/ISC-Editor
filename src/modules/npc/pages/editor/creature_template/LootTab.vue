<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InputNumber from 'primevue/inputnumber'
import EditorField from '@/components/EditorField.vue'
import EditableDataTable, { type ColumnDef } from '@/components/EditableDataTable.vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useNpcFieldModifiers } from '@/modules/npc/pages/useNpcFieldModifiers'

const { t } = useI18n()
const store = useNpcModuleStore()
const { isFieldModified } = useNpcFieldModifiers()

const form = store.formData

const MAX_QUEST_ITEMS = 6

const questItemEntries = computed(() => store.questItems.getNewEntries())
const questItemHasChanges = computed(() => store.questItems.getSqlDiff(form.entry).length > 0)

const questItemColumns: ColumnDef[] = [
  { field: 'Idx', header: t('creature_template.fields.questItem_idx'), type: 'readonly', width: '5rem' },
  { field: 'ItemId', header: t('creature_template.fields.questItem_itemId'), type: 'number' },
]

function addQuestItem() {
  if (questItemEntries.value.length >= MAX_QUEST_ITEMS) return
  const usedIdx = new Set(questItemEntries.value.map(e => e.Idx))
  let nextIdx = 0
  while (usedIdx.has(nextIdx) && nextIdx < MAX_QUEST_ITEMS) nextIdx++
  if (nextIdx >= MAX_QUEST_ITEMS) return
  store.questItems.pushNewEntry({ Idx: nextIdx, ItemId: 0 })
}

function removeQuestItem(index: number) {
  store.questItems.removeNewEntry(index)
}
</script>

<template>
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.lootConfig') }}</h4>
      <p>{{ t('creature_template.groups.lootConfigDesc') }}</p>
    </div>
    <div class="field-grid">
      <EditorField :label="t('creature_template.fields.lootid')" :modified="isFieldModified('lootid')">
        <InputNumber v-model="form.lootid" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.pickpocketloot')" :modified="isFieldModified('pickpocketloot')">
        <InputNumber v-model="form.pickpocketloot" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.skinloot')" :modified="isFieldModified('skinloot')">
        <InputNumber v-model="form.skinloot" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.mingold')" :modified="isFieldModified('mingold')">
        <InputNumber v-model="form.mingold" :useGrouping="false" fluid />
      </EditorField>
      <EditorField :label="t('creature_template.fields.maxgold')" :modified="isFieldModified('maxgold')">
        <InputNumber v-model="form.maxgold" :useGrouping="false" fluid />
      </EditorField>
    </div>
  </div>

  <EditableDataTable
    :entries="questItemEntries"
    :columns="questItemColumns"
    :hasChanges="questItemHasChanges"
    :maxRows="MAX_QUEST_ITEMS"
    :title="t('creature_template.groups.questItems')"
    :description="t('creature_template.groups.questItemsDesc')"
    dataKey="Idx"
    @add="addQuestItem"
    @remove="removeQuestItem"
  />
</template>

<style scoped>
@import '../npc-editor.css';
</style>
