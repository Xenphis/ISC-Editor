import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npc_equip(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_equip_template WHERE CreatureID = ? ORDER BY ID'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_npc_equip(params: { entry: number, equips: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_equip_template WHERE CreatureID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_equip_template (CreatureID, ID, ItemID1, ItemID2, ItemID3, VerifiedBuild) VALUES (?, ?, ?, ?, ?, ?)'
  for (const equip of params.equips) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, equip.ID, equip.ItemID1, equip.ItemID2, equip.ItemID3, equip.VerifiedBuild
    ]))
  }
  return null
}
