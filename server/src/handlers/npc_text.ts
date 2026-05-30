import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

const NPC_TEXT_COLUMNS = 'ID, text0_0, text0_1, BroadcastTextID0, lang0, Probability0, EmoteDelay0_0, Emote0_0, EmoteDelay0_1, Emote0_1, EmoteDelay0_2, Emote0_2, text1_0, text1_1, BroadcastTextID1, lang1, Probability1, EmoteDelay1_0, Emote1_0, EmoteDelay1_1, Emote1_1, EmoteDelay1_2, Emote1_2, text2_0, text2_1, BroadcastTextID2, lang2, Probability2, EmoteDelay2_0, Emote2_0, EmoteDelay2_1, Emote2_1, EmoteDelay2_2, Emote2_2, text3_0, text3_1, BroadcastTextID3, lang3, Probability3, EmoteDelay3_0, Emote3_0, EmoteDelay3_1, Emote3_1, EmoteDelay3_2, Emote3_2, text4_0, text4_1, BroadcastTextID4, lang4, Probability4, EmoteDelay4_0, Emote4_0, EmoteDelay4_1, Emote4_1, EmoteDelay4_2, Emote4_2, text5_0, text5_1, BroadcastTextID5, lang5, Probability5, EmoteDelay5_0, Emote5_0, EmoteDelay5_1, Emote5_1, EmoteDelay5_2, Emote5_2, text6_0, text6_1, BroadcastTextID6, lang6, Probability6, EmoteDelay6_0, Emote6_0, EmoteDelay6_1, Emote6_1, EmoteDelay6_2, Emote6_2, text7_0, text7_1, BroadcastTextID7, lang7, Probability7, EmoteDelay7_0, Emote7_0, EmoteDelay7_1, Emote7_1, EmoteDelay7_2, Emote7_2, VerifiedBuild'

export async function get_npc_texts(params: { ids: number[] }): Promise<any[]> {
  if (!params.ids || params.ids.length === 0) return []
  const pool = getPool()
  const placeholders = params.ids.map(() => '?').join(', ')
  const SQL = `SELECT * FROM npc_text WHERE ID IN (${placeholders}) ORDER BY ID`
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, params.ids)) as any
  return rows
}

export async function save_npc_texts(params: { texts: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const placeholders = Array(90).fill('?').join(', ')
  const SQL = `REPLACE INTO npc_text (${NPC_TEXT_COLUMNS}) VALUES (${placeholders})`
  for (const t of params.texts) {
    await withDebug('REPLACE', SQL, () => pool.query(SQL, [
      t.ID, t.text0_0, t.text0_1, t.BroadcastTextID0, t.lang0, t.Probability0, t.EmoteDelay0_0, t.Emote0_0, t.EmoteDelay0_1, t.Emote0_1, t.EmoteDelay0_2, t.Emote0_2,
      t.text1_0, t.text1_1, t.BroadcastTextID1, t.lang1, t.Probability1, t.EmoteDelay1_0, t.Emote1_0, t.EmoteDelay1_1, t.Emote1_1, t.EmoteDelay1_2, t.Emote1_2,
      t.text2_0, t.text2_1, t.BroadcastTextID2, t.lang2, t.Probability2, t.EmoteDelay2_0, t.Emote2_0, t.EmoteDelay2_1, t.Emote2_1, t.EmoteDelay2_2, t.Emote2_2,
      t.text3_0, t.text3_1, t.BroadcastTextID3, t.lang3, t.Probability3, t.EmoteDelay3_0, t.Emote3_0, t.EmoteDelay3_1, t.Emote3_1, t.EmoteDelay3_2, t.Emote3_2,
      t.text4_0, t.text4_1, t.BroadcastTextID4, t.lang4, t.Probability4, t.EmoteDelay4_0, t.Emote4_0, t.EmoteDelay4_1, t.Emote4_1, t.EmoteDelay4_2, t.Emote4_2,
      t.text5_0, t.text5_1, t.BroadcastTextID5, t.lang5, t.Probability5, t.EmoteDelay5_0, t.Emote5_0, t.EmoteDelay5_1, t.Emote5_1, t.EmoteDelay5_2, t.Emote5_2,
      t.text6_0, t.text6_1, t.BroadcastTextID6, t.lang6, t.Probability6, t.EmoteDelay6_0, t.Emote6_0, t.EmoteDelay6_1, t.Emote6_1, t.EmoteDelay6_2, t.Emote6_2,
      t.text7_0, t.text7_1, t.BroadcastTextID7, t.lang7, t.Probability7, t.EmoteDelay7_0, t.Emote7_0, t.EmoteDelay7_1, t.Emote7_1, t.EmoteDelay7_2, t.Emote7_2,
      t.VerifiedBuild
    ]))
  }
  return null
}
