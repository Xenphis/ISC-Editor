import type { ZoneCalibration } from '../types'

/**
 * Committed world→image calibrations, keyed by zone slug.
 *
 * Produced with the in-app tool at #/map-viewer/calibrate: click two known
 * diagonal reference points on the zone image, enter their world coordinates,
 * then paste the exported snippet here. Zones missing from this record show
 * a "map unavailable" placeholder in the viewer.
 */
export const BAKED_CALIBRATIONS: Record<string, ZoneCalibration> = {
}
