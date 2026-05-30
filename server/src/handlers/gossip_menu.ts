import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gossip_menu_ids(params: { search?: string, limit?: number }): Promise<number[]> {
  const pool = getPool()
  const limit = params.limit ?? 100

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL = 'SELECT DISTINCT MenuID FROM gossip_menu WHERE CAST(MenuID AS CHAR) LIKE ? ORDER BY MenuID LIMIT ?'
    const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [pattern, limit])) as any
    return rows.map((r: any) => r.MenuID)
  } else {
    const SQL = 'SELECT DISTINCT MenuID FROM gossip_menu ORDER BY MenuID LIMIT ?'
    const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [limit])) as any
    return rows.map((r: any) => r.MenuID)
  }
}

export async function get_next_custom_gossip_menu_id(params: { min_id?: number }): Promise<number> {
  const pool = getPool()
  const min_id = params.min_id ?? 50000
  const floor = min_id - 1
  const SQL = 'SELECT COALESCE(MAX(MenuID), ?) + 1 AS next_id FROM gossip_menu WHERE MenuID >= ?'
  const [[row]] = await withDebug('SELECT', SQL, () => pool.query(SQL, [floor, min_id])) as any
  return Math.max(row.next_id, min_id)
}

export async function get_gossip_menu(params: { menu_id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gossip_menu WHERE MenuID = ? ORDER BY TextID'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.menu_id])) as any
  return rows
}

export async function save_gossip_menu(params: { menu_id: number, rows: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM gossip_menu WHERE MenuID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.menu_id]))
  const SQL_INSERT = 'INSERT INTO gossip_menu (MenuID, TextID, VerifiedBuild) VALUES (?, ?, ?)'
  for (const row of params.rows) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.menu_id, row.TextID, row.VerifiedBuild
    ]))
  }
  return null
}
