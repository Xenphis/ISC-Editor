// TypeScript type for TrinityCore 'creature_classlevelstats' table
// https://trinitycore.info/database/335/world/creature_classlevelstats

export interface CreatureClassLevelStats {
  level: number;
  class: number;
  basehp0: number;
  basehp1: number;
  basehp2: number;
  basemana: number;
  basearmor: number;
  attackpower: number;
  rangedattackpower: number;
  damage_base: number;
  damage_exp1: number;
  damage_exp2: number;
  comment?: string;
}
