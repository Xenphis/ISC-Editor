import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_quests(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[], total: number }> {
  const pool = getPool()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL_DATA = 'SELECT * FROM quest_template WHERE LogTitle LIKE ? OR ID LIKE ? ORDER BY ID LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM quest_template WHERE LogTitle LIKE ? OR ID LIKE ?'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [pattern, pattern, limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT, [pattern, pattern])) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  } else {
    const SQL_DATA = 'SELECT * FROM quest_template ORDER BY ID LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM quest_template'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT)) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  }
}

export async function get_quest(params: { id: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM quest_template WHERE ID = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  if (!rows[0]) throw new Error(`Quest with ID ${params.id} not found`)
  return rows[0]
}

export async function save_quest(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = `REPLACE INTO quest_template (
    ID,QuestType,QuestLevel,MinLevel,QuestSortID,QuestInfoID,SuggestedGroupNum,
    RequiredFactionId1,RequiredFactionId2,RequiredFactionValue1,RequiredFactionValue2,
    RewardNextQuest,RewardXPDifficulty,RewardMoney,RewardBonusMoney,
    RewardDisplaySpell,RewardSpell,RewardHonor,RewardKillHonor,StartItem,Flags,RequiredPlayerKills,
    RewardItem1,RewardAmount1,RewardItem2,RewardAmount2,RewardItem3,RewardAmount3,RewardItem4,RewardAmount4,
    ItemDrop1,ItemDropQuantity1,ItemDrop2,ItemDropQuantity2,ItemDrop3,ItemDropQuantity3,ItemDrop4,ItemDropQuantity4,
    RewardChoiceItemID1,RewardChoiceItemQuantity1,RewardChoiceItemID2,RewardChoiceItemQuantity2,
    RewardChoiceItemID3,RewardChoiceItemQuantity3,RewardChoiceItemID4,RewardChoiceItemQuantity4,
    RewardChoiceItemID5,RewardChoiceItemQuantity5,RewardChoiceItemID6,RewardChoiceItemQuantity6,
    POIContinent,POIx,POIy,POIPriority,RewardTitle,RewardTalents,RewardArenaPoints,
    RewardFactionID1,RewardFactionValue1,RewardFactionOverride1,
    RewardFactionID2,RewardFactionValue2,RewardFactionOverride2,
    RewardFactionID3,RewardFactionValue3,RewardFactionOverride3,
    RewardFactionID4,RewardFactionValue4,RewardFactionOverride4,
    RewardFactionID5,RewardFactionValue5,RewardFactionOverride5,
    TimeAllowed,AllowableRaces,
    LogTitle,LogDescription,QuestDescription,AreaDescription,QuestCompletionLog,
    RequiredNpcOrGo1,RequiredNpcOrGo2,RequiredNpcOrGo3,RequiredNpcOrGo4,
    RequiredNpcOrGoCount1,RequiredNpcOrGoCount2,RequiredNpcOrGoCount3,RequiredNpcOrGoCount4,
    RequiredItemId1,RequiredItemId2,RequiredItemId3,RequiredItemId4,RequiredItemId5,RequiredItemId6,
    RequiredItemCount1,RequiredItemCount2,RequiredItemCount3,RequiredItemCount4,RequiredItemCount5,RequiredItemCount6,
    Unknown0,ObjectiveText1,ObjectiveText2,ObjectiveText3,ObjectiveText4,VerifiedBuild
  ) VALUES (
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    d.ID, d.QuestType, d.QuestLevel, d.MinLevel, d.QuestSortID, d.QuestInfoID, d.SuggestedGroupNum,
    d.RequiredFactionId1, d.RequiredFactionId2, d.RequiredFactionValue1, d.RequiredFactionValue2,
    d.RewardNextQuest, d.RewardXPDifficulty, d.RewardMoney, d.RewardBonusMoney,
    d.RewardDisplaySpell, d.RewardSpell, d.RewardHonor, d.RewardKillHonor, d.StartItem,
    d.Flags, d.RequiredPlayerKills,
    d.RewardItem1, d.RewardAmount1, d.RewardItem2, d.RewardAmount2, d.RewardItem3, d.RewardAmount3, d.RewardItem4, d.RewardAmount4,
    d.ItemDrop1, d.ItemDropQuantity1, d.ItemDrop2, d.ItemDropQuantity2, d.ItemDrop3, d.ItemDropQuantity3, d.ItemDrop4, d.ItemDropQuantity4,
    d.RewardChoiceItemID1, d.RewardChoiceItemQuantity1, d.RewardChoiceItemID2, d.RewardChoiceItemQuantity2,
    d.RewardChoiceItemID3, d.RewardChoiceItemQuantity3, d.RewardChoiceItemID4, d.RewardChoiceItemQuantity4,
    d.RewardChoiceItemID5, d.RewardChoiceItemQuantity5, d.RewardChoiceItemID6, d.RewardChoiceItemQuantity6,
    d.POIContinent, d.POIx, d.POIy, d.POIPriority, d.RewardTitle, d.RewardTalents, d.RewardArenaPoints,
    d.RewardFactionID1, d.RewardFactionValue1, d.RewardFactionOverride1,
    d.RewardFactionID2, d.RewardFactionValue2, d.RewardFactionOverride2,
    d.RewardFactionID3, d.RewardFactionValue3, d.RewardFactionOverride3,
    d.RewardFactionID4, d.RewardFactionValue4, d.RewardFactionOverride4,
    d.RewardFactionID5, d.RewardFactionValue5, d.RewardFactionOverride5,
    d.TimeAllowed, d.AllowableRaces,
    d.LogTitle, d.LogDescription, d.QuestDescription, d.AreaDescription, d.QuestCompletionLog,
    d.RequiredNpcOrGo1, d.RequiredNpcOrGo2, d.RequiredNpcOrGo3, d.RequiredNpcOrGo4,
    d.RequiredNpcOrGoCount1, d.RequiredNpcOrGoCount2, d.RequiredNpcOrGoCount3, d.RequiredNpcOrGoCount4,
    d.RequiredItemId1, d.RequiredItemId2, d.RequiredItemId3, d.RequiredItemId4, d.RequiredItemId5, d.RequiredItemId6,
    d.RequiredItemCount1, d.RequiredItemCount2, d.RequiredItemCount3, d.RequiredItemCount4, d.RequiredItemCount5, d.RequiredItemCount6,
    d.Unknown0, d.ObjectiveText1, d.ObjectiveText2, d.ObjectiveText3, d.ObjectiveText4, d.VerifiedBuild
  ]))
  return null
}

export async function delete_quest(params: { id: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM quest_template WHERE ID = ?'
  const [result] = await withDebug('DELETE', SQL, () => pool.query(SQL, [params.id])) as any
  if (result.affectedRows === 0) throw new Error(`Quest with ID ${params.id} not found`)
  return null
}
