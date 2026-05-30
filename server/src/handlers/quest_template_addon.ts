import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_quest_addon(params: { id: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM quest_template_addon WHERE ID = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  return rows[0] ?? null
}

export async function save_quest_addon(params: { id: number, addon: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const a = params.addon
  const SQL = `REPLACE INTO quest_template_addon (
    ID, MaxLevel, AllowableClasses, SourceSpellID, PrevQuestID, NextQuestID,
    ExclusiveGroup, BreadcrumbForQuestId, RewardMailTemplateID, RewardMailDelay,
    RequiredSkillID, RequiredSkillPoints, RequiredMinRepFaction, RequiredMaxRepFaction,
    RequiredMinRepValue, RequiredMaxRepValue, ProvidedItemCount, SpecialFlags
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.id, a.MaxLevel, a.AllowableClasses, a.SourceSpellID, a.PrevQuestID, a.NextQuestID,
    a.ExclusiveGroup, a.BreadcrumbForQuestId, a.RewardMailTemplateID, a.RewardMailDelay,
    a.RequiredSkillID, a.RequiredSkillPoints, a.RequiredMinRepFaction, a.RequiredMaxRepFaction,
    a.RequiredMinRepValue, a.RequiredMaxRepValue, a.ProvidedItemCount, a.SpecialFlags
  ]))
  return null
}
