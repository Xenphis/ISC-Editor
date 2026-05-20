import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { QuestTemplate } from '@/modules/quests/types/quest_template'
import type { CompositeKeyConfig } from '@/composables/useQueryGenerator'
import { ReactiveSubTable, ArraySubTable } from '@/stores/SubTableManager'
import { createEntityEditorStore } from '@/stores/createEntityEditorStore'
import { escapeSQL } from '@/utils/sql'
import * as questService from '@/modules/quests/service'

// ─── Interfaces ──────────────────────────────────────────────────────

export interface AddonForm {
  MaxLevel: number
  AllowableClasses: number
  SourceSpellID: number
  PrevQuestID: number
  NextQuestID: number
  ExclusiveGroup: number
  BreadcrumbForQuestId: number
  RewardMailTemplateID: number
  RewardMailDelay: number
  RequiredSkillID: number
  RequiredSkillPoints: number
  RequiredMinRepFaction: number
  RequiredMaxRepFaction: number
  RequiredMinRepValue: number
  RequiredMaxRepValue: number
  ProvidedItemCount: number
  SpecialFlags: number
}

export interface LocaleEntry {
  locale: string
  Title: string | null
  Details: string | null
  Objectives: string | null
  EndText: string | null
  CompletedText: string | null
  ObjectiveText1: string | null
  ObjectiveText2: string | null
  ObjectiveText3: string | null
  ObjectiveText4: string | null
}

// ─── Default factories ──────────────────────────────────────────────

export function createDefaultAddonForm(): AddonForm {
  return {
    MaxLevel: 0, AllowableClasses: 0, SourceSpellID: 0,
    PrevQuestID: 0, NextQuestID: 0, ExclusiveGroup: 0, BreadcrumbForQuestId: 0,
    RewardMailTemplateID: 0, RewardMailDelay: 0,
    RequiredSkillID: 0, RequiredSkillPoints: 0,
    RequiredMinRepFaction: 0, RequiredMaxRepFaction: 0,
    RequiredMinRepValue: 0, RequiredMaxRepValue: 0,
    ProvidedItemCount: 0, SpecialFlags: 0,
  }
}

function createDefaultForm(): QuestTemplate {
  return {
    ID: 0, QuestType: 2, QuestLevel: 0, MinLevel: 0,
    QuestSortID: 0, QuestInfoID: 0, SuggestedGroupNum: 0,
    RequiredFactionId1: 0, RequiredFactionId2: 0,
    RequiredFactionValue1: 0, RequiredFactionValue2: 0,
    RewardNextQuest: 0, RewardXPDifficulty: 0,
    RewardMoney: 0, RewardBonusMoney: 0,
    RewardDisplaySpell: 0, RewardSpell: 0,
    RewardHonor: 0, RewardKillHonor: 0,
    StartItem: 0, Flags: 0, RequiredPlayerKills: 0,
    RewardItem1: 0, RewardAmount1: 0,
    RewardItem2: 0, RewardAmount2: 0,
    RewardItem3: 0, RewardAmount3: 0,
    RewardItem4: 0, RewardAmount4: 0,
    ItemDrop1: 0, ItemDropQuantity1: 0,
    ItemDrop2: 0, ItemDropQuantity2: 0,
    ItemDrop3: 0, ItemDropQuantity3: 0,
    ItemDrop4: 0, ItemDropQuantity4: 0,
    RewardChoiceItemID1: 0, RewardChoiceItemQuantity1: 0,
    RewardChoiceItemID2: 0, RewardChoiceItemQuantity2: 0,
    RewardChoiceItemID3: 0, RewardChoiceItemQuantity3: 0,
    RewardChoiceItemID4: 0, RewardChoiceItemQuantity4: 0,
    RewardChoiceItemID5: 0, RewardChoiceItemQuantity5: 0,
    RewardChoiceItemID6: 0, RewardChoiceItemQuantity6: 0,
    POIContinent: 0, POIx: 0, POIy: 0, POIPriority: 0,
    RewardTitle: 0, RewardTalents: 0, RewardArenaPoints: 0,
    RewardFactionID1: 0, RewardFactionValue1: 0, RewardFactionOverride1: 0,
    RewardFactionID2: 0, RewardFactionValue2: 0, RewardFactionOverride2: 0,
    RewardFactionID3: 0, RewardFactionValue3: 0, RewardFactionOverride3: 0,
    RewardFactionID4: 0, RewardFactionValue4: 0, RewardFactionOverride4: 0,
    RewardFactionID5: 0, RewardFactionValue5: 0, RewardFactionOverride5: 0,
    TimeAllowed: 0, AllowableRaces: 0,
    LogTitle: undefined, LogDescription: undefined, QuestDescription: undefined,
    AreaDescription: undefined, QuestCompletionLog: undefined,
    RequiredNpcOrGo1: 0, RequiredNpcOrGo2: 0, RequiredNpcOrGo3: 0, RequiredNpcOrGo4: 0,
    RequiredNpcOrGoCount1: 0, RequiredNpcOrGoCount2: 0, RequiredNpcOrGoCount3: 0, RequiredNpcOrGoCount4: 0,
    RequiredItemId1: 0, RequiredItemId2: 0, RequiredItemId3: 0,
    RequiredItemId4: 0, RequiredItemId5: 0, RequiredItemId6: 0,
    RequiredItemCount1: 0, RequiredItemCount2: 0, RequiredItemCount3: 0,
    RequiredItemCount4: 0, RequiredItemCount5: 0, RequiredItemCount6: 0,
    Unknown0: 0,
    ObjectiveText1: undefined, ObjectiveText2: undefined, ObjectiveText3: undefined, ObjectiveText4: undefined,
    VerifiedBuild: undefined,
  }
}

// ─── Composite key config for locales ───────────────────────────────

const localeConfig: Omit<CompositeKeyConfig<LocaleEntry>, 'parentId'> = {
  table: 'quest_template_locale',
  parentKey: 'ID',
  childKey: 'locale',
  columns: ['Title', 'Details', 'Objectives', 'EndText', 'CompletedText',
            'ObjectiveText1', 'ObjectiveText2', 'ObjectiveText3', 'ObjectiveText4', 'VerifiedBuild'],
  isEqual: (a, b) =>
    a.Title === b.Title &&
    a.Details === b.Details &&
    a.Objectives === b.Objectives &&
    a.EndText === b.EndText &&
    a.CompletedText === b.CompletedText &&
    a.ObjectiveText1 === b.ObjectiveText1 &&
    a.ObjectiveText2 === b.ObjectiveText2 &&
    a.ObjectiveText3 === b.ObjectiveText3 &&
    a.ObjectiveText4 === b.ObjectiveText4,
  toSqlValues: (e) => [
    e.Title != null ? `'${escapeSQL(e.Title)}'` : null,
    e.Details != null ? `'${escapeSQL(e.Details)}'` : null,
    e.Objectives != null ? `'${escapeSQL(e.Objectives)}'` : null,
    e.EndText != null ? `'${escapeSQL(e.EndText)}'` : null,
    e.CompletedText != null ? `'${escapeSQL(e.CompletedText)}'` : null,
    e.ObjectiveText1 != null ? `'${escapeSQL(e.ObjectiveText1)}'` : null,
    e.ObjectiveText2 != null ? `'${escapeSQL(e.ObjectiveText2)}'` : null,
    e.ObjectiveText3 != null ? `'${escapeSQL(e.ObjectiveText3)}'` : null,
    e.ObjectiveText4 != null ? `'${escapeSQL(e.ObjectiveText4)}'` : null,
    0,
  ],
}

// ─── Store ──────────────────────────────────────────────────────────

export const useQuestModuleStore = defineStore('questModule', () => {
  // --- List state ---
  const quests = ref<QuestTemplate[]>([])
  const loading = ref(false)
  const currentSearch = ref('')
  const listLoaded = ref(false)

  // --- Sub-table managers ---
  const addon = new ReactiveSubTable<AddonForm>({
    tableName: 'quest_template_addon',
    primaryKey: 'ID',
    createDefault: createDefaultAddonForm,
  })

  const locales = new ArraySubTable<LocaleEntry>({
    tableName: 'quest_template_locale',
    compositeConfig: localeConfig,
    fieldPrefix: 'locale',
    summarize: (e) => `${e.Title ?? ''} / ${e.Details ?? ''}`,
  })

  const editor = createEntityEditorStore<QuestTemplate>({
    tableName: 'quest_template',
    primaryKey: 'ID',
    createDefault: createDefaultForm,
    load: questService.getQuest,
    save: questService.saveQuest,
    delete: questService.deleteQuest,
    subTables: [
      {
        manager: addon,
        load: async (id) => {
          const data = await questService.getQuestAddon(id).catch(() => null)
          if (!data) return null
          const { ID: _id, ...addonFields } = data
          return addonFields as AddonForm
        },
        commitWhenMissing: true,
      },
      {
        manager: locales,
        load: async (id) => {
          const rows = await questService.getQuestLocales(id).catch(() => [])
          return rows.map(row => ({
            locale: row.locale,
            Title: row.Title ?? null,
            Details: row.Details ?? null,
            Objectives: row.Objectives ?? null,
            EndText: row.EndText ?? null,
            CompletedText: row.CompletedText ?? null,
            ObjectiveText1: row.ObjectiveText1 ?? null,
            ObjectiveText2: row.ObjectiveText2 ?? null,
            ObjectiveText3: row.ObjectiveText3 ?? null,
            ObjectiveText4: row.ObjectiveText4 ?? null,
          })) satisfies LocaleEntry[]
        },
      },
    ],
  })

  function markListLoaded() {
    listLoaded.value = true
  }

  function setQuests(data: QuestTemplate[]) {
    quests.value = data
  }

  return {
    quests, loading, currentSearch, listLoaded,
    addon, locales,
    ...editor,
    markListLoaded, setQuests,
  }
})
