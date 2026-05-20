import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CreatureTemplate } from '@/modules/npc/types/creature_template/creature_template'
import type { CompositeKeyConfig } from '@/composables/useQueryGenerator'
import { ReactiveSubTable, ArraySubTable } from '@/stores/SubTableManager'
import { createEntityEditorStore } from '@/stores/createEntityEditorStore'
import { escapeSQL } from '@/utils/sql'
import * as npcService from '@/modules/npc/service'

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

// ─── Store ──────────────────────────────────────────────────────────

export const useNpcModuleStore = defineStore('npcModule', () => {
  // --- List state ---
  const npcs = ref<CreatureTemplate[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

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

  const editor = createEntityEditorStore<CreatureTemplate>({
    tableName: 'creature_template',
    primaryKey: 'entry',
    createDefault: createDefaultForm,
    load: npcService.getNpc,
    save: npcService.saveNpc,
    delete: npcService.deleteNpc,
    subTables: [
      {
        manager: resistances,
        load: async (entry) => {
          const rows = await npcService.getNpcResistances(entry).catch(() => [])
          return rows.map(row => ({ School: row.School, Resistance: row.Resistance })) satisfies ResistanceEntry[]
        },
      },
      {
        manager: movement,
        load: async (entry) => {
          const data = await npcService.getNpcMovement(entry).catch(() => null)
          if (!data) return null
          const { CreatureId: _creatureId, ...movementFields } = data
          return movementFields as MovementForm
        },
        commitWhenMissing: true,
      },
      {
        manager: addon,
        load: async (entry) => {
          const data = await npcService.getNpcAddon(entry).catch(() => null)
          if (!data) return null
          const { entry: _entry, ...addonFields } = data
          return addonFields as AddonForm
        },
        commitWhenMissing: true,
      },
      {
        manager: locales,
        load: async (entry) => {
          const rows = await npcService.getNpcLocales(entry).catch(() => [])
          return rows.map(row => ({ locale: row.locale, Name: row.Name, Title: row.Title })) satisfies LocaleEntry[]
        },
      },
      {
        manager: equips,
        load: async (entry) => {
          const rows = await npcService.getNpcEquip(entry).catch(() => [])
          return rows.map(row => ({ ID: row.ID, ItemID1: row.ItemID1, ItemID2: row.ItemID2, ItemID3: row.ItemID3 })) satisfies EquipEntry[]
        },
      },
      {
        manager: spells,
        load: async (entry) => {
          const rows = await npcService.getNpcSpells(entry).catch(() => [])
          return rows.map(row => ({ Index: row.Index, Spell: row.Spell })) satisfies SpellEntry[]
        },
      },
      {
        manager: texts,
        load: async (entry) => {
          const rows = await npcService.getCreatureTexts(entry).catch(() => [])
          return rows.map(row => ({
            GroupID: row.GroupID,
            ID: row.ID,
            Text: row.Text,
            Type: row.Type,
            Language: row.Language,
            Probability: row.Probability,
            Emote: row.Emote,
            Duration: row.Duration,
            Sound: row.Sound,
            BroadcastTextId: row.BroadcastTextId,
            TextRange: row.TextRange,
            comment: row.comment,
          })) satisfies TextEntry[]
        },
      },
      {
        manager: textLocales,
        load: async (entry) => {
          const rows = await npcService.getCreatureTextLocales(entry).catch(() => [])
          return rows.map(row => ({
            GroupID: row.GroupID,
            ID: row.ID,
            Locale: row.Locale,
            Text: row.Text ?? null,
          })) satisfies TextLocaleEntry[]
        },
      },
      {
        manager: questItems,
        load: async (entry) => {
          const rows = await npcService.getCreatureQuestItems(entry).catch(() => [])
          return rows.map(row => ({ Idx: row.Idx, ItemId: row.ItemId })) satisfies QuestItemEntry[]
        },
      },
    ],
  })

  function markListLoaded() {
    listLoaded.value = true
  }

  function setNpcs(data: CreatureTemplate[]) {
    npcs.value = data
  }

  return {
    // List state
    npcs, loading, currentSearch, listLoaded,
    // Sub-table managers
    resistances, movement, addon, locales, equips, spells, texts, textLocales, questItems,
    ...editor,
    editingEntry: editor.editingId,
    markListLoaded, setNpcs,
  }
})
