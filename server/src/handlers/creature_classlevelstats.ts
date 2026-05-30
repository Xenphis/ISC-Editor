import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_classlevelstats(_params: Record<string, never>): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_classlevelstats ORDER BY level, class'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL)) as any
  return rows
}

export async function get_creature_classlevelstat(params: { level: number, class_id: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_classlevelstats WHERE level = ? AND class = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.level, params.class_id])) as any
  if (!rows[0]) throw new Error(`No entry for level=${params.level} class=${params.class_id}`)
  return rows[0]
}

export async function save_creature_classlevelstat(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = 'REPLACE INTO creature_classlevelstats (level, class, basehp0, basehp1, basehp2, basemana, basearmor, attackpower, rangedattackpower, damage_base, damage_exp1, damage_exp2, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    d.level, d.class, d.basehp0, d.basehp1, d.basehp2, d.basemana, d.basearmor,
    d.attackpower, d.rangedattackpower, d.damage_base, d.damage_exp1, d.damage_exp2, d.comment
  ]))
  return null
}
