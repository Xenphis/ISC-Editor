import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_text_locales(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_text_locale WHERE CreatureID = ? ORDER BY GroupID, ID, Locale'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_creature_text_locales(params: { entry: number, locales: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_text_locale WHERE CreatureID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_text_locale (CreatureID, GroupID, ID, Locale, Text) VALUES (?, ?, ?, ?, ?)'
  for (const loc of params.locales) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, loc.GroupID, loc.ID, loc.Locale, loc.Text
    ]))
  }
  return null
}
