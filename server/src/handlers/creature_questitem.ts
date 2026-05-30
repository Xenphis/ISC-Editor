import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_questitem(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_questitem WHERE CreatureEntry = ? ORDER BY Idx'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_creature_questitem(params: { entry: number, items: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_questitem WHERE CreatureEntry = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_questitem (CreatureEntry, Idx, ItemId, VerifiedBuild) VALUES (?, ?, ?, ?)'
  for (const item of params.items) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, item.Idx, item.ItemId, item.VerifiedBuild
    ]))
  }
  return null
}
