/**
 * Common interface that every module store (npc, gameobject, items…) must implement
 * so that sessionChanges.ts can aggregate queries without knowing module internals.
 */
export interface SessionQuery {
  table: string
  entry: number
  query: string
}

export interface ModuleStore {
  /** Returns all pending SQL diff queries for this module (current editor + cached entries). */
  getAllDiffQueries(): SessionQuery[]
}
