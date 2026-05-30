import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npc_movement(params: { entry: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_template_movement WHERE CreatureId = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows[0] ?? null
}

export async function save_npc_movement(params: { entry: number, movement: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const m = params.movement
  const SQL = 'REPLACE INTO creature_template_movement (CreatureId, Ground, Swim, Flight, Rooted, Chase, `Random`, InteractionPauseTimer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.entry, m.Ground, m.Swim, m.Flight, m.Rooted, m.Chase, m.Random, m.InteractionPauseTimer
  ]))
  return null
}
