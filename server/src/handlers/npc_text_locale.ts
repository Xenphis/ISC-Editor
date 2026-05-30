import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

const NPC_TEXT_LOCALE_COLUMNS = 'ID, Locale, Text0_0, Text0_1, Text1_0, Text1_1, Text2_0, Text2_1, Text3_0, Text3_1, Text4_0, Text4_1, Text5_0, Text5_1, Text6_0, Text6_1, Text7_0, Text7_1'

export async function get_npc_text_locales(params: { ids: number[] }): Promise<any[]> {
  if (!params.ids || params.ids.length === 0) return []
  const pool = getPool()
  const placeholders = params.ids.map(() => '?').join(', ')
  const SQL = `SELECT * FROM npc_text_locale WHERE ID IN (${placeholders}) ORDER BY ID, Locale`
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, params.ids)) as any
  return rows
}

export async function save_npc_text_locales(params: {
  locales: Record<string, any>[],
  deleted: { ID: number, Locale: string }[]
}): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM npc_text_locale WHERE ID = ? AND Locale = ?'
  for (const key of params.deleted) {
    await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [key.ID, key.Locale]))
  }
  const placeholders = Array(18).fill('?').join(', ')
  const SQL = `REPLACE INTO npc_text_locale (${NPC_TEXT_LOCALE_COLUMNS}) VALUES (${placeholders})`
  for (const loc of params.locales) {
    await withDebug('REPLACE', SQL, () => pool.query(SQL, [
      loc.ID, loc.Locale,
      loc.Text0_0, loc.Text0_1, loc.Text1_0, loc.Text1_1, loc.Text2_0, loc.Text2_1,
      loc.Text3_0, loc.Text3_1, loc.Text4_0, loc.Text4_1, loc.Text5_0, loc.Text5_1,
      loc.Text6_0, loc.Text6_1, loc.Text7_0, loc.Text7_1
    ]))
  }
  return null
}
