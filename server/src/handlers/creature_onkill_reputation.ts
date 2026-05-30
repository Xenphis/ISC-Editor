import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_creature_onkill_reputation(params: { entry: number }): Promise<any | null> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_onkill_reputation WHERE creature_id = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  return rows[0] ?? null
}

export async function save_creature_onkill_reputation(params: { entry: number, reputation: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const r = params.reputation
  const SQL = 'REPLACE INTO creature_onkill_reputation (creature_id, RewOnKillRepFaction1, RewOnKillRepFaction2, MaxStanding1, IsTeamAward1, RewOnKillRepValue1, MaxStanding2, IsTeamAward2, RewOnKillRepValue2, TeamDependent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    params.entry, r.RewOnKillRepFaction1, r.RewOnKillRepFaction2,
    r.MaxStanding1, r.IsTeamAward1, r.RewOnKillRepValue1,
    r.MaxStanding2, r.IsTeamAward2, r.RewOnKillRepValue2, r.TeamDependent
  ]))
  return null
}
