/**
 * Common interface for module stores that opt into global SQL session aggregation.
 * Navigation modules are not required to implement this contract.
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
