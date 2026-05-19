import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Trainer } from '@/modules/npc/types/trainer/trainer'
import type { CompositeKeyConfig } from '@/composables/useQueryGenerator'
import { ArraySubTable, type SubTableManager } from '@/stores/SubTableManager'

// ─── TrainerSpellEntry (store-side, no TrainerId needed) ─────────────────────

export interface TrainerSpellEntry {
  SpellId: number
  MoneyCost: number
  ReqSkillLine: number
  ReqSkillRank: number
  ReqAbility1: number
  ReqAbility2: number
  ReqAbility3: number
  ReqLevel: number
}

export interface CreatureDefaultTrainerEntry {
  CreatureId: number
}

// ─── Composite key config for trainer_spell ──────────────────────────────────

const trainerSpellConfig: Omit<CompositeKeyConfig<TrainerSpellEntry>, 'parentId'> = {
  table: 'trainer_spell',
  parentKey: 'TrainerId',
  childKey: 'SpellId',
  columns: ['MoneyCost', 'ReqSkillLine', 'ReqSkillRank', 'ReqAbility1', 'ReqAbility2', 'ReqAbility3', 'ReqLevel', 'VerifiedBuild'],
  isEqual: (a, b) =>
    a.MoneyCost === b.MoneyCost &&
    a.ReqSkillLine === b.ReqSkillLine &&
    a.ReqSkillRank === b.ReqSkillRank &&
    a.ReqAbility1 === b.ReqAbility1 &&
    a.ReqAbility2 === b.ReqAbility2 &&
    a.ReqAbility3 === b.ReqAbility3 &&
    a.ReqLevel === b.ReqLevel,
  toSqlValues: (e) => [e.MoneyCost, e.ReqSkillLine, e.ReqSkillRank, e.ReqAbility1, e.ReqAbility2, e.ReqAbility3, e.ReqLevel, 0],
}

// ─── Default factory ─────────────────────────────────────────────────────────

function createDefaultForm(): Trainer {
  return {
    Id: 0,
    Type: 2,
    Requirement: 0,
    Greeting: null,
    VerifiedBuild: null,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTrainerStore = defineStore('trainer', () => {
  // --- List state ---
  const trainers = ref<Trainer[]>([])
  const loading = ref(false)
  const listLoaded = ref(false)

  // --- Editor state ---
  const editing = ref(false)
  const editingId = ref<number | null>(null)
  const formData = reactive<Trainer>(createDefaultForm())
  const originalValue = ref<Trainer | null>(null)
  const editorDataLoaded = ref(false)

  // --- Sub-table: trainer_spell ---
  const spells = new ArraySubTable<TrainerSpellEntry>({
    tableName: 'trainer_spell',
    compositeConfig: trainerSpellConfig,
    fieldPrefix: 'trainer_spell',
    summarize: (e) => String(e.SpellId),
  })

  // --- Sub-table: creature_default_trainer ---
  const creatureLinks = new ArraySubTable<CreatureDefaultTrainerEntry>({
    tableName: 'creature_default_trainer',
    compositeConfig: {
      table: 'creature_default_trainer',
      parentKey: 'TrainerId',
      childKey: 'CreatureId',
      columns: [],
      isEqual: () => true,
      toSqlValues: () => [],
    },
    fieldPrefix: 'creature_default_trainer',
    summarize: (e) => String(e.CreatureId),
  })

  const subTables: SubTableManager[] = [spells, creatureLinks]

  // --- List actions ---
  function setTrainers(data: Trainer[]) {
    trainers.value = data
  }

  function markListLoaded() {
    listLoaded.value = true
  }

  // --- Editor actions ---
  function openEditor(id: number | null) {
    editingId.value = id
    editing.value = true
    editorDataLoaded.value = false
    originalValue.value = null
    Object.assign(formData, createDefaultForm())
    for (const st of subTables) {
      st.reset()
    }
  }

  function closeEditor() {
    editing.value = false
  }

  function discardEditor() {
    editing.value = false
    editingId.value = null
    editorDataLoaded.value = false
    originalValue.value = null
    Object.assign(formData, createDefaultForm())
    for (const st of subTables) {
      st.reset()
    }
  }

  return {
    // list
    trainers,
    loading,
    listLoaded,
    // editor
    editing,
    editingId,
    formData,
    originalValue,
    editorDataLoaded,
    // sub-tables
    spells,
    creatureLinks,
    subTables,
    // actions
    setTrainers,
    markListLoaded,
    openEditor,
    closeEditor,
    discardEditor,
  }
})
