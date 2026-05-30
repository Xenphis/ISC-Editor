import type { Response } from 'express'

export interface SqlDebugLog {
  timestamp: number
  query_type: string
  sql: string
  execution_time_ms: number
  success: boolean
}

let debugEnabled = false
const clients = new Set<Response>()

export function isDebugEnabled(): boolean {
  return debugEnabled
}

export function setDebugEnabled(value: boolean): void {
  debugEnabled = value
}

export function addSseClient(res: Response): void {
  clients.add(res)
}

export function removeSseClient(res: Response): void {
  clients.delete(res)
}

export function emitDebugLog(log: SqlDebugLog): void {
  if (!debugEnabled || clients.size === 0) return
  const data = `data: ${JSON.stringify(log)}\n\n`
  clients.forEach(res => {
    try { res.write(data) } catch { clients.delete(res) }
  })
}

export async function withDebug<T>(
  queryType: string,
  sql: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    emitDebugLog({
      timestamp: start,
      query_type: queryType,
      sql,
      execution_time_ms: Date.now() - start,
      success: true,
    })
    return result
  } catch (err) {
    emitDebugLog({
      timestamp: start,
      query_type: queryType,
      sql,
      execution_time_ms: Date.now() - start,
      success: false,
    })
    throw err
  }
}
