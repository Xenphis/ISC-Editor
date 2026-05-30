import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_gameobjects(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[], total: number }> {
  const pool = getPool()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL_DATA = 'SELECT * FROM gameobject_template WHERE name LIKE ? OR entry LIKE ? ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM gameobject_template WHERE name LIKE ? OR entry LIKE ?'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [pattern, pattern, limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT, [pattern, pattern])) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  } else {
    const SQL_DATA = 'SELECT * FROM gameobject_template ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM gameobject_template'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT)) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  }
}

export async function get_gameobject(params: { entry: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM gameobject_template WHERE entry = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  if (!rows[0]) throw new Error(`GameObject with entry ${params.entry} not found`)
  return rows[0]
}

export async function save_gameobject(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = `REPLACE INTO gameobject_template (
      entry, \`type\`, displayId, name, IconName, castBarCaption, unk1, size,
      Data0, Data1, Data2, Data3, Data4, Data5, Data6, Data7,
      Data8, Data9, Data10, Data11, Data12, Data13, Data14, Data15,
      Data16, Data17, Data18, Data19, Data20, Data21, Data22, Data23,
      AIName, ScriptName, StringId, VerifiedBuild
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    d.entry, d.type, d.displayId, d.name, d.IconName, d.castBarCaption, d.unk1, d.size,
    d.Data0, d.Data1, d.Data2, d.Data3, d.Data4, d.Data5, d.Data6, d.Data7,
    d.Data8, d.Data9, d.Data10, d.Data11, d.Data12, d.Data13, d.Data14, d.Data15,
    d.Data16, d.Data17, d.Data18, d.Data19, d.Data20, d.Data21, d.Data22, d.Data23,
    d.AIName, d.ScriptName, d.StringId, d.VerifiedBuild
  ]))
  return null
}

export async function delete_gameobject(params: { entry: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM gameobject_template WHERE entry = ?'
  const [result] = await withDebug('DELETE', SQL, () => pool.query(SQL, [params.entry])) as any
  if (result.affectedRows === 0) throw new Error(`GameObject with entry ${params.entry} not found`)
  return null
}
