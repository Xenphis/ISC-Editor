import type { ZoneInfo } from '../types'
import { ZONE_IMAGE_SLUGS } from './zone-images'

/**
 * Vanilla AreaTable zone ids → bundled image slug, one entry per image in
 * src/assets/maps (continents 0 and 1 only).
 */
export const ZONES: ZoneInfo[] = [
  // Eastern Kingdoms (map 0)
  { zoneId: 1, slug: 'dun_morogh', map: 0 },
  { zoneId: 3, slug: 'badlands', map: 0 },
  { zoneId: 4, slug: 'the_blasted_lands', map: 0 },
  { zoneId: 8, slug: 'swamp_of_sorrows', map: 0 },
  { zoneId: 10, slug: 'duskwood', map: 0 },
  { zoneId: 11, slug: 'wetlands', map: 0 },
  { zoneId: 12, slug: 'elwynn_forest', map: 0 },
  { zoneId: 28, slug: 'western_plaguelands', map: 0 },
  { zoneId: 33, slug: 'stranglethorn_vale', map: 0 },
  { zoneId: 38, slug: 'loch_modan', map: 0 },
  { zoneId: 40, slug: 'westfall', map: 0 },
  { zoneId: 41, slug: 'deadwind_pass', map: 0 },
  { zoneId: 44, slug: 'redridge_mountains', map: 0 },
  { zoneId: 45, slug: 'arathi_highlands', map: 0 },
  { zoneId: 46, slug: 'burning_steppes', map: 0 },
  { zoneId: 47, slug: 'the_hinterlands', map: 0 },
  { zoneId: 51, slug: 'searing_gorge', map: 0 },
  { zoneId: 85, slug: 'tirisfal_glades', map: 0 },
  { zoneId: 130, slug: 'silverpine_forest', map: 0 },
  { zoneId: 139, slug: 'eastern_plaguelands', map: 0 },
  { zoneId: 267, slug: 'hillsbrad_foothills', map: 0 },
  // Kalimdor (map 1)
  { zoneId: 14, slug: 'durotar', map: 1 },
  { zoneId: 15, slug: 'dustwallow_marsh', map: 1 },
  { zoneId: 16, slug: 'azshara', map: 1 },
  { zoneId: 17, slug: 'the_barrens', map: 1 },
  { zoneId: 141, slug: 'teldrassil', map: 1 },
  { zoneId: 148, slug: 'darkshore', map: 1 },
  { zoneId: 215, slug: 'mulgore', map: 1 },
  { zoneId: 331, slug: 'ashenvale', map: 1 },
  { zoneId: 357, slug: 'feralas', map: 1 },
  { zoneId: 361, slug: 'felwood', map: 1 },
  { zoneId: 400, slug: 'thousand_needles', map: 1 },
  { zoneId: 405, slug: 'desolace', map: 1 },
  { zoneId: 406, slug: 'stonetalon_mountains', map: 1 },
  { zoneId: 440, slug: 'tanaris', map: 1 },
  { zoneId: 490, slug: 'ungoro_crater', map: 1 },
  { zoneId: 493, slug: 'moonglade', map: 1 },
  { zoneId: 616, slug: 'hyjal', map: 1 },
  { zoneId: 618, slug: 'winterspring', map: 1 },
  { zoneId: 1377, slug: 'silithus', map: 1 },
]

/**
 * Zones without their own image, mapped to the enclosing zone's image
 * (spawns in capitals carry the city zoneId but sit on the parent terrain).
 */
export const ZONE_ALIASES: ReadonlyMap<number, number> = new Map([
  [1519, 12], // Stormwind City → Elwynn Forest
  [1537, 1], // Ironforge → Dun Morogh
  [1497, 85], // Undercity → Tirisfal Glades
  [1637, 14], // Orgrimmar → Durotar
  [1638, 215], // Thunder Bluff → Mulgore
  [1657, 141], // Darnassus → Teldrassil
])

export const ZONE_BY_ID: ReadonlyMap<number, ZoneInfo> = new Map(
  ZONES.map(zone => [zone.zoneId, zone]),
)

export const ZONE_BY_SLUG: ReadonlyMap<string, ZoneInfo> = new Map(
  ZONES.map(zone => [zone.slug, zone]),
)

if (import.meta.env.DEV) {
  for (const zone of ZONES) {
    if (!ZONE_IMAGE_SLUGS.includes(zone.slug)) {
      console.warn(`[map_viewer] zone ${zone.zoneId} references missing image slug "${zone.slug}"`)
    }
  }
}
