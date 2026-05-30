import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobject_addon(params: { entry: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject_template_addon WHERE entry = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows[0] ?? null
}

export async function save_gameobject_addon(params: { entry: number, addon: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const a = params.addon
  const SQL = 'REPLACE INTO gameobject_template_addon (entry, faction, flags, mingold, maxgold, artkit0, artkit1, artkit2, artkit3) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.entry, a.faction, a.flags, a.mingold, a.maxgold, a.artkit0, a.artkit1, a.artkit2, a.artkit3
  ]))
  return null
}
