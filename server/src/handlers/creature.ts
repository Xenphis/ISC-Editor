import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_spawns(params: { id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature WHERE id = ? ORDER BY guid'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  return rows
}

export async function save_creature_spawn(params: { creature: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const c = params.creature
  const SQL = 'REPLACE INTO creature (guid, id, map, zoneId, areaId, spawnMask, phaseMask, modelid, equipment_id, position_x, position_y, position_z, orientation, spawntimesecs, wander_distance, currentwaypoint, curhealth, curmana, MovementType, npcflag, unit_flags, dynamicflags, ScriptName, StringId, VerifiedBuild) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    c.guid, c.id, c.map, c.zoneId, c.areaId, c.spawnMask, c.phaseMask, c.modelid,
    c.equipment_id, c.position_x, c.position_y, c.position_z, c.orientation,
    c.spawntimesecs, c.wander_distance, c.currentwaypoint, c.curhealth, c.curmana,
    c.MovementType, c.npcflag, c.unit_flags, c.dynamicflags, c.ScriptName, c.StringId, c.VerifiedBuild
  ]))
  return null
}

export async function delete_creature_spawn(params: { guid: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM creature WHERE guid = ?'
  const [result] = await withDebug('DELETE', SQL, () => pool.query(SQL, [params.guid])) as any
  if (result.affectedRows === 0) throw new Error(`Creature spawn with guid ${params.guid} not found`)
  return null
}
