import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_texts(params: { entry: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_text WHERE CreatureID = ? ORDER BY GroupID, ID'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows
}

export async function save_creature_texts(params: { entry: number, texts: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_text WHERE CreatureID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.entry]))
  const SQL_INSERT = 'INSERT INTO creature_text (CreatureID, GroupID, ID, Text, Type, Language, Probability, Emote, Duration, Sound, BroadcastTextId, TextRange, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  for (const t of params.texts) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.entry, t.GroupID, t.ID, t.Text, t.Type, t.Language,
      t.Probability, t.Emote, t.Duration, t.Sound, t.BroadcastTextId, t.TextRange, t.comment
    ]))
  }
  return null
}
