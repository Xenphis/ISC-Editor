import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobject_spawn_addon(params: { guid: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject_addon WHERE guid = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.guid])) as any
  return rows[0] ?? null
}

export async function save_gameobject_spawn_addon(params: { guid: number, addon: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const a = params.addon
  const SQL = 'REPLACE INTO gameobject_addon (guid, parent_rotation0, parent_rotation1, parent_rotation2, parent_rotation3, invisibilityType, invisibilityValue) VALUES (?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.guid, a.parent_rotation0, a.parent_rotation1, a.parent_rotation2, a.parent_rotation3,
    a.invisibilityType, a.invisibilityValue
  ]))
  return null
}
