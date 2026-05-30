import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_npcs(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[], total: number }> {
  const pool = getPool()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL_DATA = 'SELECT * FROM creature_template WHERE name LIKE ? OR entry LIKE ? ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM creature_template WHERE name LIKE ? OR entry LIKE ?'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [pattern, pattern, limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT, [pattern, pattern])) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  } else {
    const SQL_DATA = 'SELECT * FROM creature_template ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM creature_template'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT)) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  }
}

export async function get_npc(params: { entry: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM creature_template WHERE entry = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  if (!rows[0]) throw new Error(`NPC with entry ${params.entry} not found`)
  return rows[0]
}

export async function save_npc(params: { data: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const d = params.data
  const SQL = `REPLACE INTO creature_template (
      entry, difficulty_entry_1, difficulty_entry_2, difficulty_entry_3,
      KillCredit1, KillCredit2, modelid1, modelid2, modelid3, modelid4,
      name, subname, IconName, gossip_menu_id, minlevel, maxlevel,
      exp, faction, npcflag, speed_walk, speed_run, scale, \`rank\`,
      dmgschool, BaseAttackTime, RangeAttackTime, BaseVariance, RangeVariance,
      unit_class, unit_flags, unit_flags2, dynamicflags, family, \`type\`,
      type_flags, lootid, pickpocketloot, skinloot, PetSpellDataId, VehicleId,
      mingold, maxgold, AIName, MovementType, HoverHeight,
      HealthModifier, ManaModifier, ArmorModifier, DamageModifier,
      ExperienceModifier, RacialLeader, movementId, RegenHealth,
      mechanic_immune_mask, spell_school_immune_mask, flags_extra,
      ScriptName, StringId, VerifiedBuild
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?
    )`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    d.entry, d.difficulty_entry_1, d.difficulty_entry_2, d.difficulty_entry_3,
    d.KillCredit1, d.KillCredit2, d.modelid1, d.modelid2, d.modelid3, d.modelid4,
    d.name, d.subname, d.IconName, d.gossip_menu_id, d.minlevel, d.maxlevel,
    d.exp, d.faction, d.npcflag, d.speed_walk, d.speed_run, d.scale, d.rank,
    d.dmgschool, d.BaseAttackTime, d.RangeAttackTime, d.BaseVariance, d.RangeVariance,
    d.unit_class, d.unit_flags, d.unit_flags2, d.dynamicflags, d.family, d.type,
    d.type_flags, d.lootid, d.pickpocketloot, d.skinloot, d.PetSpellDataId, d.VehicleId,
    d.mingold, d.maxgold, d.AIName, d.MovementType, d.HoverHeight,
    d.HealthModifier, d.ManaModifier, d.ArmorModifier, d.DamageModifier,
    d.ExperienceModifier, d.RacialLeader, d.movementId, d.RegenHealth,
    d.mechanic_immune_mask, d.spell_school_immune_mask, d.flags_extra,
    d.ScriptName, d.StringId, d.VerifiedBuild
  ]))
  return null
}

export async function delete_npc(params: { entry: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM creature_template WHERE entry = ?'
  const [result] = await withDebug('DELETE', SQL, () => pool.query(SQL, [params.entry])) as any
  if (result.affectedRows === 0) throw new Error(`NPC with entry ${params.entry} not found`)
  return null
}
