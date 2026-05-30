import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobject_overrides(params: { spawn_id: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject_overrides WHERE spawnId = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.spawn_id])) as any
  return rows[0] ?? null
}

export async function save_gameobject_overrides(params: { spawn_id: number, overrides: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const o = params.overrides
  const SQL = 'REPLACE INTO gameobject_overrides (spawnId, faction, flags) VALUES (?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [params.spawn_id, o.faction, o.flags]))
  return null
}
