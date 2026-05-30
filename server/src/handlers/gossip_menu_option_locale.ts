import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gossip_menu_option_locales(params: { menu_id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gossip_menu_option_locale WHERE MenuID = ? ORDER BY OptionID, Locale'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.menu_id])) as any
  return rows
}

export async function save_gossip_menu_option_locales(params: { menu_id: number, locales: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM gossip_menu_option_locale WHERE MenuID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.menu_id]))
  const SQL_INSERT = 'INSERT INTO gossip_menu_option_locale (MenuID, OptionID, Locale, OptionText, BoxText) VALUES (?, ?, ?, ?, ?)'
  for (const locale of params.locales) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.menu_id, locale.OptionID, locale.Locale, locale.OptionText, locale.BoxText
    ]))
  }
  return null
}
