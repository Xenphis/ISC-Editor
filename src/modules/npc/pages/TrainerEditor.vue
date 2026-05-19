<script setup lang="ts">
import { ref, onMounted, computed, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import EditorHeader from '@/components/EditorHeader.vue'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import { useQueryGenerator } from '@/composables/useQueryGenerator'
import type { Trainer } from '@/modules/npc/types/trainer/trainer'
import { getTrainer, saveTrainer, getTrainerSpells, saveTrainerSpells, getCreatureDefaultTrainers, saveCreatureDefaultTrainers } from '@/modules/npc/service'
import { useTrainerStore, type TrainerSpellEntry, type CreatureDefaultTrainerEntry } from '@/modules/npc/stores/trainerStore'
import TrainerGeneralTab from './editor/trainer/GeneralTab.vue'
import TrainerSpellsTab from './editor/trainer/SpellsTab.vue'
import TrainerCreatureTab from './editor/trainer/CreatureTab.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useTrainerStore()

const trainerId = computed(() => {
  const param = route.params.id as string | undefined
  if (!param) return null
  const n = Number(param)
  return Number.isNaN(n) ? null : n
})

const loading = ref(false)
const form = store.formData
const originalValue = toRef(store, 'originalValue')

// --- SQL generation (main trainer table) ---
const { diffQuery, fullQuery, hasChanges, changedFields } = useQueryGenerator<Trainer>(
  'trainer',
  'Id',
  originalValue,
  form,
)

// --- Combined SQL: main table + trainer_spell sub-table ---
const combinedDiffQuery = computed(() => {
  const parts: string[] = []
  if (diffQuery.value) parts.push(diffQuery.value)
  for (const st of store.subTables) {
    const sql = st.getSqlDiff(form.Id)
    if (sql) parts.push(sql)
  }
  return parts.join('\n')
})

const combinedHasChanges = computed(() => {
  if (hasChanges.value) return true
  for (const st of store.subTables) {
    if (st.getSqlDiff(form.Id)) return true
  }
  return false
})

const combinedChangedFields = computed(() => {
  const fields = [...changedFields.value]
  for (const st of store.subTables) {
    fields.push(...st.getChangedFields(form.Id))
  }
  return fields
})

// --- Save ---
async function onExecute() {
  try {
    await saveTrainer({ ...form })
    // Build TrainerSpell rows from store entries
    const spellRows = store.spells.getNewEntries().map((e: TrainerSpellEntry) => ({
      TrainerId: form.Id,
      SpellId: e.SpellId,
      MoneyCost: e.MoneyCost,
      ReqSkillLine: e.ReqSkillLine,
      ReqSkillRank: e.ReqSkillRank,
      ReqAbility1: e.ReqAbility1,
      ReqAbility2: e.ReqAbility2,
      ReqAbility3: e.ReqAbility3,
      ReqLevel: e.ReqLevel,
      VerifiedBuild: null,
    }))
    await saveTrainerSpells(form.Id, spellRows)
    const creatureRows = store.creatureLinks.getNewEntries().map((e: CreatureDefaultTrainerEntry) => ({
      CreatureId: e.CreatureId,
      TrainerId: form.Id,
    }))
    await saveCreatureDefaultTrainers(form.Id, creatureRows)
    store.discardEditor()
    router.push('/npc/trainer')
  } catch (e) {
    console.error('Failed to save trainer:', e)
  }
}

function onBack() {
  store.closeEditor()
  router.push('/npc/trainer')
}

function onDiscard() {
  if (trainerId.value != null && originalValue.value) {
    Object.assign(form, originalValue.value)
    for (const st of store.subTables) {
      st.revert()
    }
  }
}

onMounted(async () => {
  if (store.editorDataLoaded) return

  if (!store.editing || store.editingId !== trainerId.value) {
    store.openEditor(trainerId.value)
  }

  if (trainerId.value != null) {
    loading.value = true
    try {
      const id = trainerId.value
      const [data, spellRows, creatureRows] = await Promise.all([
        getTrainer(id),
        getTrainerSpells(id).catch(() => []),
        getCreatureDefaultTrainers(id).catch(() => []),
      ])

      Object.assign(form, data)
      originalValue.value = { ...data }

      const entries: TrainerSpellEntry[] = spellRows.map(s => ({
        SpellId: s.SpellId,
        MoneyCost: s.MoneyCost,
        ReqSkillLine: s.ReqSkillLine,
        ReqSkillRank: s.ReqSkillRank,
        ReqAbility1: s.ReqAbility1,
        ReqAbility2: s.ReqAbility2,
        ReqAbility3: s.ReqAbility3,
        ReqLevel: s.ReqLevel,
      }))
      store.spells.load(entries)

      const creatureEntries: CreatureDefaultTrainerEntry[] = creatureRows.map(c => ({ CreatureId: c.CreatureId }))
      store.creatureLinks.load(creatureEntries)

      store.editorDataLoaded = true
    } catch (e) {
      console.error('Failed to load trainer:', e)
    } finally {
      loading.value = false
    }
  }
})
</script>

<template>
  <div class="trainer-editor">
    <EditorHeader
      :title="t('trainer.editorTitle')"
      :subtitle="form.Greeting ?? undefined"
      :id="trainerId ?? undefined"
      :backLabel="t('trainer.back')"
      :hasChanges="combinedHasChanges"
      :discardLabel="t('trainer.discard')"
      :executeLabel="t('trainer.execute')"
      @back="onBack"
      @discard="onDiscard"
      @execute="onExecute"
    />

    <SqlQueryPanel
      :diffQuery="combinedDiffQuery"
      :fullQuery="fullQuery"
      :hasChanges="combinedHasChanges"
      :changedFields="combinedChangedFields"
    />

    <Tabs value="general">
      <TabList>
        <Tab value="general">{{ t('trainer.tabs.general') }}</Tab>
        <Tab value="spells">{{ t('trainer.tabs.spells') }}</Tab>
        <Tab value="creature">{{ t('trainer.tabs.creature') }}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="general">
          <TrainerGeneralTab />
        </TabPanel>
        <TabPanel value="spells">
          <TrainerSpellsTab />
        </TabPanel>
        <TabPanel value="creature">
          <TrainerCreatureTab />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.trainer-editor {
  max-width: 80rem;
}

/* Override PrimeVue input styles for dark theme */
:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  height: 2.6rem !important;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber-input:focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15) !important;
}

:deep(.p-inputtext::placeholder),
:deep(.p-inputnumber-input::placeholder) {
  color: #475569 !important;
}

:deep(.p-select) {
  background: rgba(15, 23, 42, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  height: 2.6rem !important;
}

:deep(.p-select .p-select-label) {
  padding: 0 0.75rem !important;
  line-height: 2.6rem !important;
}

:deep(.p-select:focus),
:deep(.p-select.p-focus) {
  border-color: rgba(6, 182, 212, 0.5) !important;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15) !important;
}

:deep(.p-select-label) {
  color: #e2e8f0 !important;
}

/* Tabs styling */
:deep(.p-tabs) {
  background: transparent !important;
}

:deep(.p-tablist) {
  background: transparent !important;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

:deep(.p-tablist-content) {
  background: transparent !important;
}

:deep(.p-tablist-tab-list) {
  background: transparent !important;
  border: none !important;
}

:deep(.p-tab) {
  color: #94a3b8 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.p-tab:hover) {
  color: #e2e8f0 !important;
  background: rgba(30, 41, 59, 0.3) !important;
  border-radius: 0.75rem 0.75rem 0 0 !important;
}

:deep(.p-tab-active),
:deep(.p-tab[data-p-active="true"]),
:deep(.p-tab[aria-selected="true"]) {
  color: #22d3ee !important;
  background: rgba(15, 23, 42, 0.6) !important;
  border-bottom: 2px solid #22d3ee !important;
  border-radius: 0.75rem 0.75rem 0 0 !important;
}

:deep(.p-tablist-active-bar) {
  background: #22d3ee !important;
}

:deep(.p-tabpanels) {
  background: transparent !important;
  padding: 1.5rem 0 0 0 !important;
}

:deep(.p-tabpanel) {
  background: transparent !important;
  padding: 0 !important;
}
</style>
