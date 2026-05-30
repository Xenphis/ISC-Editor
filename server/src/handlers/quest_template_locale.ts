import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_quest_locales(params: { id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM quest_template_locale WHERE ID = ? ORDER BY locale'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  return rows
}

export async function save_quest_locales(params: { id: number, locales: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM quest_template_locale WHERE ID = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.id]))
  const SQL_INSERT = `INSERT INTO quest_template_locale (
    ID, locale, Title, Details, Objectives, EndText, CompletedText,
    ObjectiveText1, ObjectiveText2, ObjectiveText3, ObjectiveText4, VerifiedBuild
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
  for (const locale of params.locales) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.id, locale.locale, locale.Title, locale.Details, locale.Objectives,
      locale.EndText, locale.CompletedText,
      locale.ObjectiveText1, locale.ObjectiveText2, locale.ObjectiveText3, locale.ObjectiveText4
    ]))
  }
  return null
}
