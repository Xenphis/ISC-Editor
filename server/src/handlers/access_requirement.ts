import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_access_requirements(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[], total: number }> {
  const pool = getPool()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL_DATA = 'SELECT * FROM access_requirement WHERE mapId LIKE ? OR comment LIKE ? ORDER BY mapId, difficulty LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM access_requirement WHERE mapId LIKE ? OR comment LIKE ?'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [pattern, pattern, limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT, [pattern, pattern])) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  } else {
    const SQL_DATA = 'SELECT * FROM access_requirement ORDER BY mapId, difficulty LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM access_requirement'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT)) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  }
}

export async function get_access_requirement(params: { map_id: number, difficulty: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM access_requirement WHERE mapId = ? AND difficulty = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.map_id, params.difficulty])) as any
  if (!rows[0]) throw new Error(`Access requirement for mapId=${params.map_id} difficulty=${params.difficulty} not found`)
  return rows[0]
}

export async function save_access_requirement(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = 'REPLACE INTO access_requirement (mapId, difficulty, level_min, level_max, item, item2, quest_done_A, quest_done_H, completed_achievement, quest_failed_text, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    d.mapId, d.difficulty, d.level_min, d.level_max, d.item, d.item2,
    d.quest_done_A, d.quest_done_H, d.completed_achievement, d.quest_failed_text, d.comment
  ]))
  return null
}

export async function delete_access_requirement(params: { map_id: number, difficulty: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM access_requirement WHERE mapId = ? AND difficulty = ?'
  await withDebug('DELETE', SQL, () => pool.query(SQL, [params.map_id, params.difficulty]))
  return null
}
