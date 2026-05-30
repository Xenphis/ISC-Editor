import { invoke } from '@/utils/invoke'
import type { QuestTemplate } from '@/modules/quests/types/quest_template'
import type { QuestTemplateAddon } from '@/modules/quests/types/quest_template_addon'
import type { QuestTemplateLocale } from '@/modules/quests/types/quest_template_locale'

export interface QuestListResult {
  data: QuestTemplate[]
  total: number
}

export async function getQuests(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<QuestListResult> {
  return invoke('get_quests', { search, limit, offset })
}

export async function getQuest(id: number): Promise<QuestTemplate> {
  return invoke('get_quest', { id })
}

export async function saveQuest(data: QuestTemplate): Promise<void> {
  return invoke('save_quest', { data })
}

export async function deleteQuest(id: number): Promise<void> {
  return invoke('delete_quest', { id })
}

export async function getQuestAddon(id: number): Promise<QuestTemplateAddon | null> {
  return invoke('get_quest_addon', { id })
}

export async function saveQuestAddon(id: number, addon: QuestTemplateAddon): Promise<void> {
  return invoke('save_quest_addon', { id, addon })
}

export async function getQuestLocales(id: number): Promise<QuestTemplateLocale[]> {
  return invoke('get_quest_locales', { id })
}

export async function saveQuestLocales(id: number, locales: QuestTemplateLocale[]): Promise<void> {
  return invoke('save_quest_locales', { id, locales })
}
