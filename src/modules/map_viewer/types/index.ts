/** WoW world coordinates: +x points north, +y points west. */
export interface WorldPoint {
  x: number
  y: number
}

/** Position on a zone image as fractions of its size (u: left→right, v: top→bottom, 0..1). */
export interface ImagePoint {
  u: number
  v: number
}

/**
 * Axis-aligned, north-up affine world→image transform:
 *   u = ax * world.y + bx
 *   v = ay * world.x + by
 * On correctly calibrated north-up maps both `ax` and `ay` are negative
 * (world +x = north = up, world +y = west = left).
 */
export interface ZoneCalibration {
  ax: number
  bx: number
  ay: number
  by: number
}

/** One reference point pairing a known world position with its spot on the image. */
export interface CalibrationSample {
  world: WorldPoint
  image: ImagePoint
}

/** Possibly-incomplete reference point as typed in the calibration tool. */
export interface CalibrationPointDraft {
  image: ImagePoint | null
  worldX: number | null
  worldY: number | null
}

/** The two reference points of a zone, persisted so the zone can be recalibrated later. */
export interface CalibrationDraft {
  a: CalibrationPointDraft
  b: CalibrationPointDraft
}

/** Plain dot overlay on the map (calibration clicks), independent from pin projection. */
export interface MapMarker {
  id: string
  label: string
  point: ImagePoint
}

export interface ZoneInfo {
  zoneId: number
  slug: string
  /** Continent: 0 = Eastern Kingdoms, 1 = Kalimdor. */
  map: 0 | 1
}

/** Generic marker so future integrations (gameobjects, quests, game_tele) reuse the viewer. */
export interface MapPin {
  /** Unique key, e.g. `creature-<guid>`. */
  id: string
  /** Tooltip main line, e.g. `GUID 52110`. */
  label: string
  /** Tooltip secondary line, e.g. formatted coordinates. */
  sublabel?: string
  world: WorldPoint
  map: number
  /** 0 = unknown (falls back to calibrated-bbox lookup). */
  zoneId: number
}

export type ZoneResolution =
  | { kind: 'zone'; slug: string }
  /** Pin lives on a map other than continents 0/1 (instance, battleground…). */
  | { kind: 'unsupported-map' }
  /** Vanilla continent but no zone table / calibration bbox matched. */
  | { kind: 'unresolved' }
