import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npc_resistances(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_template_resistance WHERE CreatureID = ? ORDER BY School'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_npc_resistances(params: { entry: number, resistances: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_template_resistance WHERE CreatureID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_template_resistance (CreatureID, School, Resistance, VerifiedBuild) VALUES (?, ?, ?, ?)'
  for (const r of params.resistances) {
    if (r.Resistance !== 0) {
      await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
        params.entry, r.School, r.Resistance, r.VerifiedBuild
      ]))
    }
  }
  return null
}
