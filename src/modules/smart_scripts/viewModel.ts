import type { SmartScript } from './types'
import { SAI_EVENT_LINK } from './types'

// Flat smart_scripts rows ⇄ card tree. Rows are grouped per script
// (entryorguid + source_type); inside a group, `link` chains nest linearly
// under their first row.

export interface SaiCardNode {
  row: SmartScript
  /** Rows executed via `link` right after this one (linear chain, nested) */
  children: SaiCardNode[]
  /** Event-61 row that no other row links to (kept verbatim, warned) */
  orphan?: boolean
  /** Link target that is not an event-61 row (fires on its own event too) */
  linkedNonLinkEvent?: boolean
}

export interface SaiScriptGroup {
  entryorguid: number
  sourceType: number
  nodes: SaiCardNode[]
  /** A link cycle was detected; nesting is broken up for the affected rows */
  hasCycle: boolean
}

export function groupKey(entryorguid: number, sourceType: number): string {
  return `${entryorguid}:${sourceType}`
}

/**
 * Build the card tree from flat rows. Rows must not be mutated here: nodes
 * hold references so card edits flow back to the manager's entries.
 */
export function buildScriptGroups(rows: SmartScript[]): SaiScriptGroup[] {
  const byGroup = new Map<string, SmartScript[]>()
  for (const row of rows) {
    const key = groupKey(row.entryorguid, row.source_type)
    const list = byGroup.get(key)
    if (list) {
      list.push(row)
    } else {
      byGroup.set(key, [row])
    }
  }

  const groups: SaiScriptGroup[] = []
  for (const groupRows of byGroup.values()) {
    const sorted = [...groupRows].sort((a, b) => a.id - b.id)
    const byId = new Map(sorted.map(r => [r.id, r]))
    const linkTargets = new Set<number>()
    for (const row of sorted) {
      if (row.link !== 0 && byId.has(row.link)) {
        linkTargets.add(row.link)
      }
    }

    let hasCycle = false
    const consumed = new Set<number>()
    const nodes: SaiCardNode[] = []

    for (const row of sorted) {
      if (consumed.has(row.id)) continue
      if (linkTargets.has(row.id)) {
        // Reached later as part of its parent's chain
        if (row.event_type === SAI_EVENT_LINK) continue
        // Linked but also has a real event: appears both nested and standalone
        // in-game; render it top-level with a marker.
        nodes.push({ row, children: [], linkedNonLinkEvent: true })
        consumed.add(row.id)
        continue
      }

      const node: SaiCardNode = { row, children: [] }
      if (row.event_type === SAI_EVENT_LINK) {
        node.orphan = true
      }
      consumed.add(row.id)

      // Follow the link chain
      const visited = new Set<number>([row.id])
      let cursor = row
      while (cursor.link !== 0) {
        const child = byId.get(cursor.link)
        if (!child) break
        if (visited.has(child.id) || consumed.has(child.id)) {
          hasCycle = true
          break
        }
        node.children.push({
          row: child,
          children: [],
          linkedNonLinkEvent: child.event_type !== SAI_EVENT_LINK || undefined,
        })
        visited.add(child.id)
        consumed.add(child.id)
        cursor = child
      }
      nodes.push(node)
    }

    const first = sorted[0]
    if (!first) continue
    groups.push({
      entryorguid: first.entryorguid,
      sourceType: first.source_type,
      nodes,
      hasCycle,
    })
  }

  return groups.sort((a, b) => {
    if (a.sourceType !== b.sourceType) return a.sourceType - b.sourceType
    return a.entryorguid - b.entryorguid
  })
}

/**
 * Flatten a group's nodes back to rows with sequential ids (0-based) and
 * consistent links: a parent is followed immediately by its chain children,
 * each pointing to the next through `link`. Mutates the row objects.
 */
export function flattenGroup(group: SaiScriptGroup): SmartScript[] {
  const rows: SmartScript[] = []
  let nextId = 0

  for (const node of group.nodes) {
    node.row.id = nextId++
    rows.push(node.row)
    let previous = node.row
    for (const child of node.children) {
      child.row.id = nextId++
      previous.link = child.row.id
      rows.push(child.row)
      previous = child.row
    }
    previous.link = 0
  }

  return rows
}
