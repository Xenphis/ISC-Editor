import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npc_spells(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_template_spell WHERE CreatureID = ? ORDER BY `Index`'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_npc_spells(params: { entry: number, spells: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_template_spell WHERE CreatureID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_template_spell (CreatureID, `Index`, Spell, VerifiedBuild) VALUES (?, ?, ?, ?)'
  for (const spell of params.spells) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, spell.Index, spell.Spell, spell.VerifiedBuild
    ]))
  }
  return null
}
