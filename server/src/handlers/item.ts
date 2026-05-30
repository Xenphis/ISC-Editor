import { getPool } from '../db.js'
import { withDebug } from '../debug.js'

export async function get_items(params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[], total: number }> {
  const pool = getPool()
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  if (params.search && params.search.trim() !== '') {
    const pattern = `%${params.search}%`
    const SQL_DATA = 'SELECT * FROM item_template WHERE name LIKE ? OR entry LIKE ? ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM item_template WHERE name LIKE ? OR entry LIKE ?'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [pattern, pattern, limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT, [pattern, pattern])) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  } else {
    const SQL_DATA = 'SELECT * FROM item_template ORDER BY entry LIMIT ? OFFSET ?'
    const SQL_COUNT = 'SELECT COUNT(*) FROM item_template'
    const [rows] = await withDebug('SELECT', SQL_DATA, () => pool.query(SQL_DATA, [limit, offset])) as any
    const [[countRow]] = await withDebug('SELECT', SQL_COUNT, () => pool.query(SQL_COUNT)) as any
    return { data: rows, total: countRow['COUNT(*)'] ?? 0 }
  }
}

export async function get_item(params: { entry: number }): Promise<any> {
  const pool = getPool()
  const SQL = 'SELECT * FROM item_template WHERE entry = ?'
  const [rows] = await withDebug('SELECT', SQL, () => pool.query(SQL, [params.entry])) as any
  if (!rows[0]) throw new Error(`Item with entry ${params.entry} not found`)
  return rows[0]
}

export async function save_item(params: { item: Record<string, any> }): Promise<null> {
  const pool = getPool()
  const i = params.item
  const SQL = `REPLACE INTO item_template (
      entry, class, subclass, SoundOverrideSubclass, name, displayid, Quality,
      Flags, FlagsExtra, BuyCount, BuyPrice, SellPrice, InventoryType,
      AllowableClass, AllowableRace, ItemLevel, RequiredLevel, RequiredSkill,
      RequiredSkillRank, requiredspell, requiredhonorrank, RequiredCityRank,
      RequiredReputationFaction, RequiredReputationRank, maxcount, stackable,
      ContainerSlots, StatsCount, stat_type1, stat_value1, stat_type2, stat_value2,
      stat_type3, stat_value3, stat_type4, stat_value4, stat_type5, stat_value5,
      stat_type6, stat_value6, stat_type7, stat_value7, stat_type8, stat_value8,
      stat_type9, stat_value9, stat_type10, stat_value10, ScalingStatDistribution,
      ScalingStatValue, dmg_min1, dmg_max1, dmg_type1, dmg_min2, dmg_max2, dmg_type2,
      armor, holy_res, fire_res, nature_res, frost_res, shadow_res, arcane_res,
      delay, ammo_type, RangedModRange, spellid_1, spelltrigger_1, spellcharges_1,
      spellppmRate_1, spellcooldown_1, spellcategory_1, spellcategorycooldown_1,
      spellid_2, spelltrigger_2, spellcharges_2, spellppmRate_2, spellcooldown_2,
      spellcategory_2, spellcategorycooldown_2, spellid_3, spelltrigger_3,
      spellcharges_3, spellppmRate_3, spellcooldown_3, spellcategory_3,
      spellcategorycooldown_3, spellid_4, spelltrigger_4, spellcharges_4,
      spellppmRate_4, spellcooldown_4, spellcategory_4, spellcategorycooldown_4,
      spellid_5, spelltrigger_5, spellcharges_5, spellppmRate_5, spellcooldown_5,
      spellcategory_5, spellcategorycooldown_5, bonding, description, PageText,
      LanguageID, PageMaterial, startquest, lockid, Material, sheath,
      RandomProperty, RandomSuffix, block, itemset, MaxDurability, area, Map,
      BagFamily, TotemCategory, socketColor_1, socketContent_1, socketColor_2,
      socketContent_2, socketColor_3, socketContent_3, socketBonus, GemProperties,
      RequiredDisenchantSkill, ArmorDamageModifier, duration, ItemLimitCategory,
      HolidayId, ScriptName, DisenchantID, FoodType, minMoneyLoot, maxMoneyLoot,
      flagsCustom, VerifiedBuild
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`
  await withDebug('REPLACE', SQL, () => pool.query(SQL, [
    i.entry, i.class, i.subclass, i.SoundOverrideSubclass, i.name, i.displayid, i.Quality,
    i.Flags, i.FlagsExtra, i.BuyCount, i.BuyPrice, i.SellPrice, i.InventoryType,
    i.AllowableClass, i.AllowableRace, i.ItemLevel, i.RequiredLevel, i.RequiredSkill,
    i.RequiredSkillRank, i.requiredspell, i.requiredhonorrank, i.RequiredCityRank,
    i.RequiredReputationFaction, i.RequiredReputationRank, i.maxcount, i.stackable,
    i.ContainerSlots, i.StatsCount, i.stat_type1, i.stat_value1, i.stat_type2, i.stat_value2,
    i.stat_type3, i.stat_value3, i.stat_type4, i.stat_value4, i.stat_type5, i.stat_value5,
    i.stat_type6, i.stat_value6, i.stat_type7, i.stat_value7, i.stat_type8, i.stat_value8,
    i.stat_type9, i.stat_value9, i.stat_type10, i.stat_value10, i.ScalingStatDistribution,
    i.ScalingStatValue, i.dmg_min1, i.dmg_max1, i.dmg_type1, i.dmg_min2, i.dmg_max2, i.dmg_type2,
    i.armor, i.holy_res, i.fire_res, i.nature_res, i.frost_res, i.shadow_res, i.arcane_res,
    i.delay, i.ammo_type, i.RangedModRange,
    i.spellid_1, i.spelltrigger_1, i.spellcharges_1, i.spellppmRate_1, i.spellcooldown_1, i.spellcategory_1, i.spellcategorycooldown_1,
    i.spellid_2, i.spelltrigger_2, i.spellcharges_2, i.spellppmRate_2, i.spellcooldown_2, i.spellcategory_2, i.spellcategorycooldown_2,
    i.spellid_3, i.spelltrigger_3, i.spellcharges_3, i.spellppmRate_3, i.spellcooldown_3, i.spellcategory_3, i.spellcategorycooldown_3,
    i.spellid_4, i.spelltrigger_4, i.spellcharges_4, i.spellppmRate_4, i.spellcooldown_4, i.spellcategory_4, i.spellcategorycooldown_4,
    i.spellid_5, i.spelltrigger_5, i.spellcharges_5, i.spellppmRate_5, i.spellcooldown_5, i.spellcategory_5, i.spellcategorycooldown_5,
    i.bonding, i.description, i.PageText, i.LanguageID, i.PageMaterial, i.startquest, i.lockid, i.Material, i.sheath,
    i.RandomProperty, i.RandomSuffix, i.block, i.itemset, i.MaxDurability, i.area, i.Map,
    i.BagFamily, i.TotemCategory,
    i.socketColor_1, i.socketContent_1, i.socketColor_2, i.socketContent_2,
    i.socketColor_3, i.socketContent_3, i.socketBonus, i.GemProperties,
    i.RequiredDisenchantSkill, i.ArmorDamageModifier, i.duration, i.ItemLimitCategory,
    i.HolidayId, i.ScriptName, i.DisenchantID, i.FoodType, i.minMoneyLoot, i.maxMoneyLoot,
    i.flagsCustom, i.VerifiedBuild
  ]))
  return null
}

export async function delete_item(params: { entry: number }): Promise<null> {
  const pool = getPool()
  const SQL = 'DELETE FROM item_template WHERE entry = ?'
  await withDebug('DELETE', SQL, () => pool.query(SQL, [params.entry]))
  return null
}
