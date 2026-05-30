import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_movement_override(params: { spawn_id: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_movement_override WHERE SpawnId = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.spawn_id])) as any
  return rows[0] ?? null
}

export async function save_creature_movement_override(params: { spawn_id: number, movement: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const m = params.movement
  const SQL = 'REPLACE INTO creature_movement_override (SpawnId, Ground, Swim, Flight, Rooted, Chase, `Random`, InteractionPauseTimer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.spawn_id, m.Ground, m.Swim, m.Flight, m.Rooted, m.Chase, m.Random, m.InteractionPauseTimer
  ]))
  return null
}
