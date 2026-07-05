import { invoke } from '@tauri-apps/api/core'
import type { SaiCondition, SmartScript } from './types'
import type { SaiOwnedKey } from './sql'
import {
  SAI_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST,
  SAI_ACTION_CALL_RANDOM_TIMED_ACTIONLIST,
  SAI_ACTION_CALL_TIMED_ACTIONLIST,
  SAI_SOURCE_TYPE_CREATURE,
  SAI_SOURCE_TYPE_TIMED_ACTIONLIST,
} from './types'
import type { SmartScriptsPayload } from './SaiSubTables'

export async function getSmartScripts(keys: number[], sourceTypes: number[]): Promise<SmartScript[]> {
  return invoke('get_smart_scripts', { keys, types: sourceTypes })
}

export async function getSmartScriptsRange(min: number, max: number): Promise<SmartScript[]> {
  return invoke('get_smart_scripts_range', { min, max })
}

export async function saveSmartScripts(deleteKeys: SaiOwnedKey[], scripts: SmartScript[]): Promise<void> {
  return invoke('save_smart_scripts', { keys: deleteKeys, scripts })
}

export async function getSmartConditions(sourceEntries: number[]): Promise<SaiCondition[]> {
  return invoke('get_smart_conditions', { entries: sourceEntries })
}

export async function saveSmartConditions(deleteKeys: SaiOwnedKey[], conditions: SaiCondition[]): Promise<void> {
  return invoke('save_smart_conditions', { keys: deleteKeys, conditions })
}

/** Actionlist ids referenced by a row's action (types 80/87/88). */
export function referencedActionlistIds(row: SmartScript): number[] {
  switch (row.action_type) {
    case SAI_ACTION_CALL_TIMED_ACTIONLIST:
      return row.action_param1 > 0 ? [row.action_param1] : []
    case SAI_ACTION_CALL_RANDOM_TIMED_ACTIONLIST:
      return [
        row.action_param1, row.action_param2, row.action_param3,
        row.action_param4, row.action_param5, row.action_param6,
      ].filter(id => id > 0)
    case SAI_ACTION_CALL_RANDOM_RANGE_TIMED_ACTIONLIST: {
      const min = row.action_param1
      const max = row.action_param2
      if (min <= 0 || max < min || max - min > 100) return []
      return Array.from({ length: max - min + 1 }, (_, i) => min + i)
    }
    default:
      return []
  }
}

/**
 * Load the full SmartAI script set of a creature: entry script, per-spawn
 * guid scripts (negative entryorguid), actionlists in the conventional
 * entry*100 window, plus actionlists referenced from loaded rows (one
 * recursion level, cycle-guarded).
 */
export async function loadSmartAiPayload(entry: number, spawnGuids: number[]): Promise<SmartScriptsPayload> {
  const creatureKeys = [entry, ...spawnGuids.map(g => -g)]
  const windowMin = entry * 100
  const windowMax = entry * 100 + 99

  const [creatureRows, windowRows] = await Promise.all([
    getSmartScripts(creatureKeys, [SAI_SOURCE_TYPE_CREATURE]),
    getSmartScriptsRange(windowMin, windowMax),
  ])

  const rows = [...creatureRows, ...windowRows]
  const loadedActionlists = new Set(windowRows.map(r => r.entryorguid))

  // Referenced actionlists outside the conventional window (one extra pass
  // to catch actionlists that call other actionlists).
  let toDiscover = rows
  for (let depth = 0; depth < 2; depth++) {
    const missing = new Set<number>()
    for (const row of toDiscover) {
      for (const id of referencedActionlistIds(row)) {
        if (!loadedActionlists.has(id)) missing.add(id)
      }
    }
    if (missing.size === 0) break
    const extra = await getSmartScripts([...missing], [SAI_SOURCE_TYPE_TIMED_ACTIONLIST])
    for (const id of missing) loadedActionlists.add(id)
    rows.push(...extra)
    toDiscover = extra
  }

  // Owned keys = every distinct script actually present (delete scope)
  const seen = new Set<string>()
  const ownedKeys: SaiOwnedKey[] = []
  for (const row of rows) {
    const key = `${row.entryorguid}:${row.source_type}`
    if (!seen.has(key)) {
      seen.add(key)
      ownedKeys.push({ entryorguid: row.entryorguid, sourceType: row.source_type })
    }
  }
  // The entry script is always owned, even when currently empty, so adding
  // a first row generates the right DELETE scope.
  if (!seen.has(`${entry}:${SAI_SOURCE_TYPE_CREATURE}`)) {
    ownedKeys.push({ entryorguid: entry, sourceType: SAI_SOURCE_TYPE_CREATURE })
  }

  return { rows, ownedKeys }
}
