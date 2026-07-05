import type {
  CalibrationSample,
  ImagePoint,
  MapPin,
  WorldPoint,
  ZoneCalibration,
  ZoneResolution,
} from './types'
import { ZONE_ALIASES, ZONE_BY_ID, ZONE_BY_SLUG } from './data/zones'
import { hasZoneImage } from './data/zone-images'

/** Continents covered by the bundled zone images. */
const SUPPORTED_MAPS = new Set([0, 1])

/** Two reference points closer than this (yards) on either world axis are rejected. */
const EPS_WORLD = 1
/** Two reference points closer than this (image fraction) on either axis are rejected. */
const EPS_IMAGE = 0.005

export type CalibrationErrorCode = 'sameWorld' | 'sameImage'

export class CalibrationError extends Error {
  readonly code: CalibrationErrorCode

  constructor(code: CalibrationErrorCode) {
    super(`calibration failed: ${code}`)
    this.code = code
  }
}

/**
 * Derives the affine transform from two reference samples.
 *
 * The points must differ on both world axes and both image axes (the maps are
 * axis-aligned, so each screen axis is solved independently); pick two roughly
 * diagonal landmarks. Throws CalibrationError otherwise.
 *
 * Returns `signWarning: true` when ax or ay comes out positive — on a
 * north-up map both must be negative, and a positive slope almost always
 * means the world X/Y values were swapped when typed in.
 */
export function computeCalibration(
  p1: CalibrationSample,
  p2: CalibrationSample,
): { calibration: ZoneCalibration; signWarning: boolean } {
  if (Math.abs(p2.world.y - p1.world.y) < EPS_WORLD || Math.abs(p2.world.x - p1.world.x) < EPS_WORLD) {
    throw new CalibrationError('sameWorld')
  }
  if (Math.abs(p2.image.u - p1.image.u) < EPS_IMAGE || Math.abs(p2.image.v - p1.image.v) < EPS_IMAGE) {
    throw new CalibrationError('sameImage')
  }

  const ax = (p2.image.u - p1.image.u) / (p2.world.y - p1.world.y)
  const bx = p1.image.u - ax * p1.world.y
  const ay = (p2.image.v - p1.image.v) / (p2.world.x - p1.world.x)
  const by = p1.image.v - ay * p1.world.x

  return {
    calibration: { ax, bx, ay, by },
    signWarning: ax > 0 || ay > 0,
  }
}

export function worldToImage(cal: ZoneCalibration, w: WorldPoint): ImagePoint {
  return { u: cal.ax * w.y + cal.bx, v: cal.ay * w.x + cal.by }
}

export function imageToWorld(cal: ZoneCalibration, p: ImagePoint): WorldPoint {
  return { x: (p.v - cal.by) / cal.ay, y: (p.u - cal.bx) / cal.ax }
}

export interface WorldBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** World-space bbox covered by the image (inverse of the unit square). */
export function calibrationWorldBounds(cal: ZoneCalibration): WorldBounds {
  const a = imageToWorld(cal, { u: 0, v: 0 })
  const b = imageToWorld(cal, { u: 1, v: 1 })
  return {
    minX: Math.min(a.x, b.x),
    maxX: Math.max(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxY: Math.max(a.y, b.y),
  }
}

function boundsContain(bounds: WorldBounds, w: WorldPoint): boolean {
  return w.x >= bounds.minX && w.x <= bounds.maxX && w.y >= bounds.minY && w.y <= bounds.maxY
}

function boundsArea(bounds: WorldBounds): number {
  return (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)
}

/**
 * Maps a pin to a zone image slug.
 *
 * zoneId (or its capital-city alias) wins when known — even uncalibrated, so
 * the viewer can show which zone needs calibrating. zoneId 0 falls back to the
 * smallest calibrated bbox containing the point on the pin's continent.
 */
export function resolveZone(
  pin: MapPin,
  calibrations: Record<string, ZoneCalibration>,
): ZoneResolution {
  if (!SUPPORTED_MAPS.has(pin.map)) {
    return { kind: 'unsupported-map' }
  }

  const zoneId = ZONE_ALIASES.get(pin.zoneId) ?? pin.zoneId
  const zone = ZONE_BY_ID.get(zoneId)
  if (zone) {
    return { kind: 'zone', slug: zone.slug }
  }

  let best: { slug: string; area: number } | null = null
  for (const [slug, cal] of Object.entries(calibrations)) {
    const info = ZONE_BY_SLUG.get(slug)
    if (!info || info.map !== pin.map || !hasZoneImage(slug)) continue
    const bounds = calibrationWorldBounds(cal)
    if (!boundsContain(bounds, pin.world)) continue
    const area = boundsArea(bounds)
    if (!best || area < best.area) {
      best = { slug, area }
    }
  }
  return best ? { kind: 'zone', slug: best.slug } : { kind: 'unresolved' }
}

export interface GroupedPins {
  /** Pins per zone slug, insertion-ordered by descending pin count. */
  zones: Map<string, MapPin[]>
  unsupportedMap: MapPin[]
  unresolved: MapPin[]
}

export function groupPinsByZone(
  pins: MapPin[],
  calibrations: Record<string, ZoneCalibration>,
): GroupedPins {
  const zones = new Map<string, MapPin[]>()
  const unsupportedMap: MapPin[] = []
  const unresolved: MapPin[] = []

  for (const pin of pins) {
    const resolution = resolveZone(pin, calibrations)
    if (resolution.kind === 'unsupported-map') {
      unsupportedMap.push(pin)
    } else if (resolution.kind === 'unresolved') {
      unresolved.push(pin)
    } else {
      const group = zones.get(resolution.slug)
      if (group) {
        group.push(pin)
      } else {
        zones.set(resolution.slug, [pin])
      }
    }
  }

  const ordered = new Map(
    [...zones.entries()].sort((a, b) => b[1].length - a[1].length),
  )
  return { zones: ordered, unsupportedMap, unresolved }
}
