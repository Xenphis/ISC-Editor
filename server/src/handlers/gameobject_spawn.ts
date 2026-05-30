import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobject_spawns(params: { id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject WHERE id = ? ORDER BY guid'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  return rows
}

export async function save_gameobject_spawn(params: { spawn: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const s = params.spawn
  const SQL = `REPLACE INTO gameobject (
      guid, id, map, zoneId, areaId, spawnMask, phaseMask,
      position_x, position_y, position_z, orientation,
      rotation0, rotation1, rotation2, rotation3,
      spawntimesecs, animprogress, state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    s.guid, s.id, s.map, s.zoneId, s.areaId, s.spawnMask, s.phaseMask,
    s.position_x, s.position_y, s.position_z, s.orientation,
    s.rotation0, s.rotation1, s.rotation2, s.rotation3,
    s.spawntimesecs, s.animprogress, s.state
  ]))
  return null
}

export async function delete_gameobject_spawn(params: { guid: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM gameobject WHERE guid = ?'
  const [result] = await withDebug('DELETE', SQL, () => pool.query(SQL, [params.guid])) as any
  if (result.affectedRows === 0) throw new Error(`GameObject spawn with guid ${params.guid} not found`)
  return null
}
