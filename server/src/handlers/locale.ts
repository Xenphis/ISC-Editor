import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npc_locales(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_template_locale WHERE entry = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_npc_locales(params: { entry: number, locales: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_template_locale WHERE entry = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_template_locale (entry, locale, Name, Title, VerifiedBuild) VALUES (?, ?, ?, ?, ?)'
  for (const loc of params.locales) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, loc.locale, loc.Name, loc.Title, loc.VerifiedBuild
    ]))
  }
  return null
}
