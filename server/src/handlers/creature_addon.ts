import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_addon(params: { guid: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_addon WHERE guid = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.guid])) as any
  return rows[0] ?? null
}

export async function save_creature_addon(params: { guid: number, addon: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const a = params.addon
  const SQL = 'REPLACE INTO creature_addon (guid, path_id, mount, MountCreatureID, StandState, AnimTier, VisFlags, SheathState, PvPFlags, emote, visibilityDistanceType, auras) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.guid, a.path_id, a.mount, a.MountCreatureID, a.StandState, a.AnimTier,
    a.VisFlags, a.SheathState, a.PvPFlags, a.emote, a.visibilityDistanceType, a.auras
  ]))
  return null
}
