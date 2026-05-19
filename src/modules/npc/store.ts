import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { CreatureTemplate } from '@/modules/npc/types/creature_template/creature_template'
import type { CompositeKeyConfig } from '@/composables/useQueryGenerator'
import { ReactiveSubTable, ArraySubTable, type SubTableManager, type SubTableSnapshot } from '@/stores/SubTableManager'
import { generateDiffQuery } from '@/composables/useQueryGenerator'
import type { SessionQuery } from '@/stores/moduleStore'
import { escapeSQL } from '@/utils/sql'

// ─── Interfaces ──────────────────────────────────────────────────────

export interface ResistanceEntry {
  School: number
  Resistance: number
}

export interface MovementForm {
  Ground: number
  Swim: number
  Flight: number
  Rooted: number
  Chase: number
  Random: number
  InteractionPauseTimer: number
}

export interface AddonForm {
  path_id: number
  mount: number
  MountCreatureID: number
  StandState: number
  AnimTier: number
  VisFlags: number
  SheathState: number
  PvPFlags: number
  emote: number
  visibilityDistanceType: number
  auras: string | null
}

export interface EquipEntry {
  ID: number
  ItemID1: number
  ItemID2: number
  ItemID3: number
}

export interface SpellEntry {
  Index: number
  Spell: number
}

export interface LocaleEntry {
  locale: string
  Name: string
  Title: string | null
}

export interface TextLocaleEntry {
  GroupID: number
  ID: number
  Locale: string
  Text: string | null
}

export interface QuestItemEntry {
  Idx: number
  ItemId: number
}

export interface TextEntry {
  GroupID: number
  ID: number
  Text: string | null
  Type: number
  Language: number
  Probability: number
  Emote: number
  Duration: number
  Sound: number
  BroadcastTextId: number
  TextRange: number
  comment: string | null
}

// ─── Default factories ──────────────────────────────────────────────

export function createDefaultMovementForm(): MovementForm {
  return { Ground: 1, Swim: 1, Flight: 0, Rooted: 0, Chase: 0, Random: 0, InteractionPauseTimer: 0 }
}

export function createDefaultAddonForm(): AddonForm {
  return { path_id: 0, mount: 0, MountCreatureID: 0, StandState: 0, AnimTier: 0, VisFlags: 0, SheathState: 0, PvPFlags: 0, emote: 0, visibilityDistanceType: 0, auras: null }
}

function createDefaultForm(): CreatureTemplate {
  return {
    entry: 0, difficulty_entry_1: 0, difficulty_entry_2: 0, difficulty_entry_3: 0,
    KillCredit1: 0, KillCredit2: 0,
    modelid1: 0, modelid2: 0, modelid3: 0, modelid4: 0,
    name: '', subname: null, IconName: null, gossip_menu_id: 0,
    minlevel: 1, maxlevel: 1, exp: 0, faction: 0, npcflag: 0,
    speed_walk: 1, speed_run: 1.14286, scale: 1, rank: 0, dmgschool: 0,
    BaseAttackTime: 2000, RangeAttackTime: 2000, BaseVariance: 1, RangeVariance: 1,
    unit_class: 1, unit_flags: 0, unit_flags2: 0, dynamicflags: 0,
    family: 0, type: 0, type_flags: 0,
    lootid: 0, pickpocketloot: 0, skinloot: 0,
    PetSpellDataId: 0, VehicleId: 0, mingold: 0, maxgold: 0,
    AIName: '', MovementType: 0, HoverHeight: 1,
    HealthModifier: 1, ManaModifier: 1, ArmorModifier: 1, DamageModifier: 1, ExperienceModifier: 1,
    RacialLeader: 0, movementId: 0, RegenHealth: 1,
    mechanic_immune_mask: 0, spell_school_immune_mask: 0, flags_extra: 0,
    ScriptName: '', StringId: null, VerifiedBuild: null,
  }
}

// ─── Composite key configs ──────────────────────────────────────────

const resistanceConfig: Omit<CompositeKeyConfig<ResistanceEntry>, 'parentId'> = {
  table: 'creature_template_resistance',
  parentKey: 'CreatureID',
  childKey: 'School',
  columns: ['Resistance', 'VerifiedBuild'],
  isEqual: (a, b) => a.Resistance === b.Resistance,
  toSqlValues: (e) => [e.Resistance, 0],
  skipInsert: (e) => e.Resistance === 0,
}

const localeConfig: Omit<CompositeKeyConfig<LocaleEntry>, 'parentId'> = {
  table: 'creature_template_locale',
  parentKey: 'entry',
  childKey: 'locale',
  columns: ['Name', 'Title', 'VerifiedBuild'],
  isEqual: (a, b) => a.Name === b.Name && a.Title === b.Title,
  toSqlValues: (e) => [
    `'${escapeSQL(e.Name)}'`,
    e.Title != null ? `'${escapeSQL(e.Title)}'` : null,
    0,
  ],
}

const spellConfig: Omit<CompositeKeyConfig<SpellEntry>, 'parentId'> = {
  table: 'creature_template_spell',
  parentKey: 'CreatureID',
  childKey: 'Index',
  columns: ['Spell', 'VerifiedBuild'],
  isEqual: (a, b) => a.Spell === b.Spell,
  toSqlValues: (e) => [e.Spell, 0],
}

const textConfig: Omit<CompositeKeyConfig<TextEntry>, 'parentId'> = {
  table: 'creature_text',
  parentKey: 'CreatureID',
  childKey: 'GroupID',
  columns: ['ID', 'Text', 'Type', 'Language', 'Probability', 'Emote', 'Duration', 'Sound', 'BroadcastTextId', 'TextRange', 'comment'],
  isEqual: (a, b) => 
    a.ID === b.ID &&
    a.Text === b.Text &&
    a.Type === b.Type &&
    a.Language === b.Language &&
    a.Probability === b.Probability &&
    a.Emote === b.Emote &&
    a.Duration === b.Duration &&
    a.Sound === b.Sound &&
    a.BroadcastTextId === b.BroadcastTextId &&
    a.TextRange === b.TextRange &&
    a.comment === b.comment,
  toSqlValues: (e) => [
    e.ID,
    e.Text != null ? `'${escapeSQL(e.Text)}'` : null,
    e.Type,
    e.Language,
    e.Probability,
    e.Emote,
    e.Duration,
    e.Sound,
    e.BroadcastTextId,
    e.TextRange,
    e.comment != null ? `'${escapeSQL(e.comment)}'` : null,
  ],
  // Composite key: (CreatureID, GroupID, ID)
  getUniqueKey: (e) => `${e.GroupID}:${e.ID}`,
  buildWhereClause: (e, parentId) => `\`CreatureID\` = ${parentId} AND \`GroupID\` = ${e.GroupID} AND \`ID\` = ${e.ID}`,
}

const textLocaleConfig: Omit<CompositeKeyConfig<TextLocaleEntry>, 'parentId'> = {
  table: 'creature_text_locale',
  parentKey: 'CreatureID',
  childKey: 'Locale',
  columns: ['GroupID', 'ID', 'Text'],
  isEqual: (a, b) => a.GroupID === b.GroupID && a.ID === b.ID && a.Text === b.Text,
  toSqlValues: (e) => [
    e.GroupID,
    e.ID,
    e.Text != null ? `'${escapeSQL(e.Text)}'` : null,
  ],
  getUniqueKey: (e) => `${e.GroupID}:${e.ID}:${e.Locale}`,
  buildWhereClause: (e, parentId) =>
    `\`CreatureID\` = ${parentId} AND \`GroupID\` = ${e.GroupID} AND \`ID\` = ${e.ID} AND \`Locale\` = '${escapeSQL(e.Locale)}'`,
}

const equipConfig: Omit<CompositeKeyConfig<EquipEntry>, 'parentId'> = {
  table: 'creature_equip_template',
  parentKey: 'CreatureID',
  childKey: 'ID',
  columns: ['ItemID1', 'ItemID2', 'ItemID3', 'VerifiedBuild'],
  isEqual: (a, b) => a.ItemID1 === b.ItemID1 && a.ItemID2 === b.ItemID2 && a.ItemID3 === b.ItemID3,
  toSqlValues: (e) => [e.ItemID1, e.ItemID2, e.ItemID3, 0],
}

const questItemConfig: Omit<CompositeKeyConfig<QuestItemEntry>, 'parentId'> = {
  table: 'creature_questitem',
  parentKey: 'CreatureEntry',
  childKey: 'Idx',
  columns: ['ItemId', 'VerifiedBuild'],
  isEqual: (a, b) => a.ItemId === b.ItemId,
  toSqlValues: (e) => [e.ItemId, 0],
}

// ─── EditorCache (generic via SubTableSnapshot map) ─────────────────

interface EditorCache {
  formData: CreatureTemplate
  originalValue: CreatureTemplate
  subTables: Record<string, SubTableSnapshot>
}

// ─── Store ──────────────────────────────────────────────────────────

export const useNpcModuleStore = defineStore('npcModule', () => {
  // --- List state ---
  const npcs = ref<CreatureTemplate[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Editor state ---
  const editing = ref(false)
  const editingEntry = ref<number | null>(null)
  const formData = reactive<CreatureTemplate>(createDefaultForm())
  const originalValue = ref<CreatureTemplate | null>(null)
  const editorDataLoaded = ref(false)

  // --- Sub-table managers ---
  const resistances = new ArraySubTable<ResistanceEntry>({
    tableName: 'creature_template_resistance',
    compositeConfig: resistanceConfig,
    fieldPrefix: 'resistance_school',
    summarize: (e) => String(e.Resistance),
  })

  const movement = new ReactiveSubTable<MovementForm>({
    tableName: 'creature_template_movement',
    primaryKey: 'CreatureId',
    createDefault: createDefaultMovementForm,
  })

  const addon = new ReactiveSubTable<AddonForm>({
    tableName: 'creature_template_addon',
    primaryKey: 'entry',
    createDefault: createDefaultAddonForm,
  })

  const locales = new ArraySubTable<LocaleEntry>({
    tableName: 'creature_template_locale',
    compositeConfig: localeConfig,
    fieldPrefix: 'locale',
    summarize: (e) => `${e.Name} / ${e.Title ?? ''}`,
  })

  const equips = new ArraySubTable<EquipEntry>({
    tableName: 'creature_equip_template',
    compositeConfig: equipConfig,
    fieldPrefix: 'equip_set',
    summarize: (e) => `${e.ItemID1}/${e.ItemID2}/${e.ItemID3}`,
  })

  const spells = new ArraySubTable<SpellEntry>({
    tableName: 'creature_template_spell',
    compositeConfig: spellConfig,
    fieldPrefix: 'spell_slot',
    summarize: (e) => String(e.Spell),
  })

  const textLocales = new ArraySubTable<TextLocaleEntry>({
    tableName: 'creature_text_locale',
    compositeConfig: textLocaleConfig,
    fieldPrefix: 'text_locale',
    summarize: (e) => `[${e.GroupID}:${e.ID}:${e.Locale}] ${e.Text || '(empty)'}`,
  })

  const texts = new ArraySubTable<TextEntry>({
    tableName: 'creature_text',
    compositeConfig: textConfig,
    fieldPrefix: 'text_group',
    summarize: (e) => `[${e.GroupID}:${e.ID}] ${e.Text || '(empty)'}`,
  })

  const questItems = new ArraySubTable<QuestItemEntry>({
    tableName: 'creature_questitem',
    compositeConfig: questItemConfig,
    fieldPrefix: 'quest_item',
    summarize: (e) => String(e.ItemId),
  })

  /** All sub-table managers, iterated generically in cache/reset operations */
  const subTables: SubTableManager[] = [resistances, movement, addon, locales, equips, spells, texts, textLocales, questItems]

  // --- Multi-entry cache: persists modifications across NPC switches ---
  const dirtyCache = ref<Map<number, EditorCache>>(new Map())

  function saveToCache() {
    if (editingEntry.value != null && editorDataLoaded.value) {
      const subTableSnapshots: Record<string, SubTableSnapshot> = {}
      for (const st of subTables) {
        subTableSnapshots[st.tableName] = st.snapshot()
      }
      dirtyCache.value.set(editingEntry.value, {
        formData: { ...formData },
        originalValue: originalValue.value ? { ...originalValue.value } : { ...formData },
        subTables: subTableSnapshots,
      })
    }
  }

  function restoreFromCache(entry: number): boolean {
    const cached = dirtyCache.value.get(entry)
    if (cached) {
      Object.assign(formData, cached.formData)
      originalValue.value = { ...cached.originalValue }
      for (const st of subTables) {
        const snap = cached.subTables[st.tableName]
        if (snap) st.restore(snap)
      }
      editorDataLoaded.value = true
      return true
    }
    return false
  }

  function openEditor(entry: number | null) {
    saveToCache()
    editingEntry.value = entry
    editing.value = true

    if (entry != null && restoreFromCache(entry)) {
      return
    }

    // New entry or null: reset form
    editorDataLoaded.value = false
    originalValue.value = null
    Object.assign(formData, createDefaultForm())
    
    for (const st of subTables) {
      st.reset()
    }
  }

  function closeEditor() {
    saveToCache()
    editing.value = false
  }

  function discardEditor() {
    if (editingEntry.value != null) {
      dirtyCache.value.delete(editingEntry.value)
    }
    editing.value = false
    editingEntry.value = null
    originalValue.value = null
    editorDataLoaded.value = false
    Object.assign(formData, createDefaultForm())
    for (const st of subTables) {
      st.reset()
    }
  }

  function setFormData(data: CreatureTemplate) {
    Object.assign(formData, data)
  }

  function setOriginalValue(data: CreatureTemplate) {
    originalValue.value = { ...data }
  }

  function markEditorLoaded() {
    editorDataLoaded.value = true
  }

  function markListLoaded() {
    listLoaded.value = true
  }

  function setNpcs(data: CreatureTemplate[]) {
    npcs.value = data
  }

  function getAllDiffQueries(): SessionQuery[] {
    const queries: SessionQuery[] = []

    // Current editor state
    if (editingEntry.value != null && editorDataLoaded.value && originalValue.value) {
      const q = generateDiffQuery(
        'creature_template',
        'entry',
        originalValue.value as Record<string, unknown>,
        formData as unknown as Record<string, unknown>,
      )
      if (q) {
        queries.push({ table: 'creature_template', entry: editingEntry.value, query: q })
      }
      for (const st of subTables) {
        const sql = st.getSqlDiff(editingEntry.value)
        if (sql) {
          queries.push({ table: st.tableName, entry: editingEntry.value, query: sql })
        }
      }
    }

    // Cached dirty entries
    for (const [entry, cached] of dirtyCache.value) {
      if (entry === editingEntry.value && editorDataLoaded.value) {
        continue
      }

      const q = generateDiffQuery(
        'creature_template',
        'entry',
        cached.originalValue as Record<string, unknown>,
        cached.formData as Record<string, unknown>,
      )
      if (q) {
        queries.push({ table: 'creature_template', entry, query: q })
      }

      for (const [tableName, snap] of Object.entries(cached.subTables)) {
        const st = subTables.find(s => s.tableName === tableName)
        if (!st) {
          continue
        }
        const currentSnap = st.snapshot()
        st.restore(snap)
        const sql = st.getSqlDiff(entry)
        if (sql) {
          queries.push({ table: tableName, entry, query: sql })
        }
        st.restore(currentSnap)
      }
    }

    return queries
  }

  return {
    // List state
    npcs, loading, currentSearch, listLoaded,
    // Editor state
    editing, editingEntry, formData, originalValue, editorDataLoaded,
    // Sub-table managers
    subTables,
    resistances, movement, addon, locales, equips, spells, texts, textLocales, questItems,
    // Cache
    dirtyCache,
    // Actions
    openEditor, closeEditor, discardEditor,
    setFormData, setOriginalValue,
    markEditorLoaded, markListLoaded, setNpcs,
    // ModuleStore interface
    getAllDiffQueries,
  }
})
