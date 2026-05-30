import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobject_loot(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject_loot_template WHERE Entry = ? ORDER BY Item'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_gameobject_loot(params: { entry: number, loot: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM gameobject_loot_template WHERE Entry = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO gameobject_loot_template (Entry, Item, Reference, Chance, QuestRequired, LootMode, GroupId, MinCount, MaxCount, Comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  for (const item of params.loot) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, item.Item, item.Reference, item.Chance, item.QuestRequired,
      item.LootMode, item.GroupId, item.MinCount, item.MaxCount, item.Comment
    ]))
  }
  return null
}
