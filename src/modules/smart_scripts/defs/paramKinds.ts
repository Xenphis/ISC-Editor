import type { ParamDef } from '../types'

// ─── Param value formatting (used by card sentences and tooltips) ────

function formatMs(value: number): string {
  if (value === 0) return '0ms'
  if (value % 60000 === 0) return `${value / 60000}min`
  if (value % 1000 === 0) return `${value / 1000}s`
  if (value > 1000) return `${(value / 1000).toFixed(1)}s`
  return `${value}ms`
}

/**
 * Render a single param value for display according to its metadata.
 * Unknown enum/bitmask values fall back to the raw number so data is
 * never hidden.
 */
export function formatParam(value: number, def: ParamDef): string {
  switch (def.kind) {
    case 'ms':
      return formatMs(value)
    case 'percent':
      return `${value}%`
    case 'bool':
      return value ? 'yes' : 'no'
    case 'enum': {
      const opt = def.options?.find(o => o.value === value)
      return opt ? opt.name : String(value)
    }
    case 'bitmask': {
      if (value === 0) return 'none'
      const names = (def.bitmask ?? [])
        .filter(o => (value & o.value) !== 0)
        .map(o => o.name)
      const known = (def.bitmask ?? []).reduce((acc, o) => acc | o.value, 0)
      const unknown = value & ~known
      if (unknown !== 0) names.push(`0x${unknown.toString(16).toUpperCase()}`)
      return names.join(' | ') || String(value)
    }
    default:
      return String(value)
  }
}

/** Interpolate {p1}..{p6} placeholders of a sentence template. */
export function interpolateTemplate(
  template: string,
  params: ParamDef[],
  values: Record<number, number>,
): string {
  return template.replace(/\{p([1-6])\}/g, (_, digit: string) => {
    const index = Number(digit)
    const def = params.find(p => p.index === index)
    const value = values[index] ?? 0
    return def ? formatParam(value, def) : String(value)
  })
}

// ─── Shorthand builders to keep the def files compact ────────────────

type ParamIndex = ParamDef['index']

export function p(index: ParamIndex, label: string, kind: ParamDef['kind'] = 'number', extra?: Partial<ParamDef>): ParamDef {
  return { index, label, kind, ...extra }
}

/** Common "CooldownMin / CooldownMax" (ms) pair. */
export function cooldownPair(first: ParamIndex, second: ParamIndex): ParamDef[] {
  return [
    p(first, 'Cooldown min', 'ms', { help: 'Minimum delay before the event can fire again' }),
    p(second, 'Cooldown max', 'ms', { help: 'Maximum delay before the event can fire again' }),
  ]
}

/** Common "RepeatMin / RepeatMax" (ms) pair. */
export function repeatPair(first: ParamIndex, second: ParamIndex): ParamDef[] {
  return [
    p(first, 'Repeat min', 'ms', { help: 'Minimum delay between repeats (0 = no repeat)' }),
    p(second, 'Repeat max', 'ms', { help: 'Maximum delay between repeats' }),
  ]
}
