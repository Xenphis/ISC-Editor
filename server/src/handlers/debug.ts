import { setDebugEnabled, isDebugEnabled } from '../debug.js'

export async function set_debug_mode(params: { enabled: boolean }): Promise<null> {
  setDebugEnabled(params.enabled)
  return null
}

export async function get_debug_mode(_params: Record<string, never>): Promise<boolean> {
  return isDebugEnabled()
}
