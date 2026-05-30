import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gossip_menu_options(params: { menu_id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gossip_menu_option WHERE MenuID = ? ORDER BY OptionID'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.menu_id])) as any
  return rows
}

export async function save_gossip_menu_options(params: { menu_id: number, options: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM gossip_menu_option WHERE MenuID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.menu_id]))
  const SQL_INSERT = 'INSERT INTO gossip_menu_option (MenuID, OptionID, OptionIcon, OptionText, OptionBroadcastTextID, OptionType, OptionNpcFlag, ActionMenuID, ActionPoiID, BoxCoded, BoxMoney, BoxText, BoxBroadcastTextID, VerifiedBuild) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  for (const option of params.options) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.menu_id, option.OptionID, option.OptionIcon, option.OptionText,
      option.OptionBroadcastTextID, option.OptionType, option.OptionNpcFlag,
      option.ActionMenuID, option.ActionPoiID, option.BoxCoded, option.BoxMoney,
      option.BoxText, option.BoxBroadcastTextID, option.VerifiedBuild
    ]))
  }
  return null
}
