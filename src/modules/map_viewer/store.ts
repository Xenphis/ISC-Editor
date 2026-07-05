import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { CalibrationDraft, CalibrationPointDraft, ZoneCalibration } from './types'
import { BAKED_CALIBRATIONS } from './data/zone-calibration'

const STORAGE_KEY = 'mapViewer:calibrationOverrides'
const SAMPLES_STORAGE_KEY = 'mapViewer:calibrationSamples'

function readInitial(): Record<string, ZoneCalibration> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Partial<ZoneCalibration>>
      const overrides: Record<string, ZoneCalibration> = {}
      for (const [slug, cal] of Object.entries(parsed)) {
        if (
          typeof cal?.ax === 'number' && typeof cal.bx === 'number'
          && typeof cal.ay === 'number' && typeof cal.by === 'number'
        ) {
          overrides[slug] = { ax: cal.ax, bx: cal.bx, ay: cal.ay, by: cal.by }
        }
      }
      return overrides
    }
  } catch {
    /* ignore corrupted storage */
  }
  return {}
}

function sanitizePoint(point: Partial<CalibrationPointDraft> | undefined): CalibrationPointDraft {
  const image = point?.image
  return {
    image: typeof image?.u === 'number' && typeof image?.v === 'number'
      ? { u: image.u, v: image.v }
      : null,
    worldX: typeof point?.worldX === 'number' ? point.worldX : null,
    worldY: typeof point?.worldY === 'number' ? point.worldY : null,
  }
}

function readInitialSamples(): Record<string, CalibrationDraft> {
  try {
    const raw = localStorage.getItem(SAMPLES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Partial<CalibrationDraft>>
      const samples: Record<string, CalibrationDraft> = {}
      for (const [slug, draft] of Object.entries(parsed)) {
        samples[slug] = { a: sanitizePoint(draft?.a), b: sanitizePoint(draft?.b) }
      }
      return samples
    }
  } catch {
    /* ignore corrupted storage */
  }
  return {}
}

/**
 * Zone-calibration overrides created with the #/map-viewer/calibrate tool.
 *
 * Overrides live in localStorage and shadow BAKED_CALIBRATIONS so a freshly
 * computed calibration previews everywhere immediately; committing it means
 * pasting the exported snippet into data/zone-calibration.ts.
 */
export const useMapViewerStore = defineStore('mapViewer', () => {
  const overrides = ref<Record<string, ZoneCalibration>>(readInitial())
  /** Reference points entered in the tool, kept per zone for later recalibration. */
  const samples = ref<Record<string, CalibrationDraft>>(readInitialSamples())

  watch(overrides, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* ignore storage quota errors */
    }
  }, { deep: true })

  watch(samples, (value) => {
    try {
      localStorage.setItem(SAMPLES_STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* ignore storage quota errors */
    }
  }, { deep: true })

  const effectiveCalibrations = computed<Record<string, ZoneCalibration>>(() => ({
    ...BAKED_CALIBRATIONS,
    ...overrides.value,
  }))

  function setOverride(slug: string, cal: ZoneCalibration) {
    overrides.value = { ...overrides.value, [slug]: cal }
  }

  function clearOverride(slug: string) {
    const { [slug]: _removed, ...rest } = overrides.value
    overrides.value = rest
  }

  function setSamples(slug: string, draft: CalibrationDraft) {
    samples.value = { ...samples.value, [slug]: draft }
  }

  return { overrides, samples, effectiveCalibrations, setOverride, clearOverride, setSamples }
})
