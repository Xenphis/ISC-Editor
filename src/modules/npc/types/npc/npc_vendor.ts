export interface NpcVendor {
  entry: number;
  slot: number;
  item: number;
  maxcount: number;
  incrtime: number;
  ExtendedCost: number;
  type?: number;
  BonusListIDs?: string;
  PlayerConditionID?: number;
  IgnoreFiltering?: number;
}
