import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_trainers(_params: Record<string, never>): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM trainer ORDER BY Id'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL)) as any
  return rows
}

export async function get_trainer(params: { id: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM trainer WHERE Id = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.id])) as any
  if (!rows[0]) throw new Error(`Trainer ${params.id} not found`)
  return rows[0]
}

export async function save_trainer(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = 'REPLACE INTO trainer (Id, Type, Requirement, Greeting, VerifiedBuild) VALUES (?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [d.Id, d.Type, d.Requirement, d.Greeting, d.VerifiedBuild]))
  return null
}

export async function delete_trainer(params: { id: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM trainer WHERE Id = ?'
  await withDebug('DELETE', SQL, () => pool.query(SQL, [params.id]))
  return null
}

export async function get_trainer_spells(params: { trainer_id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM trainer_spell WHERE TrainerId = ? ORDER BY SpellId'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.trainer_id])) as any
  return rows
}

export async function save_trainer_spells(params: { trainer_id: number, spells: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM trainer_spell WHERE TrainerId = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.trainer_id]))
  const SQL_INSERT = 'INSERT INTO trainer_spell (TrainerId, SpellId, MoneyCost, ReqSkillLine, ReqSkillRank, ReqAbility1, ReqAbility2, ReqAbility3, ReqLevel, VerifiedBuild) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  for (const s of params.spells) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [
      params.trainer_id, s.SpellId, s.MoneyCost, s.ReqSkillLine, s.ReqSkillRank,
      s.ReqAbility1, s.ReqAbility2, s.ReqAbility3, s.ReqLevel, s.VerifiedBuild
    ]))
  }
  return null
}

export async function get_creature_default_trainers(params: { trainer_id: number }): Promise<any[]> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_default_trainer WHERE TrainerId = ? ORDER BY CreatureId'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.trainer_id])) as any
  return rows
}

export async function save_creature_default_trainers(params: { trainer_id: number, entries: Record<string, any>[] }): Promise<null> {
  const pool = getPool()
  const SQL_DELETE = 'DELETE FROM creature_default_trainer WHERE TrainerId = ?'
  await withDebug('DELETE', SQL_DELETE, () => pool.query(SQL_DELETE, [params.trainer_id]))
  const SQL_INSERT = 'INSERT INTO creature_default_trainer (CreatureId, TrainerId) VALUES (?, ?)'
  for (const e of params.entries) {
    await withDebug('INSERT', SQL_INSERT, () => pool.query(SQL_INSERT, [e.CreatureId, params.trainer_id]))
  }
  return null
}
