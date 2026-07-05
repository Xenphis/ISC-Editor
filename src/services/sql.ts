import { invoke } from '@tauri-apps/api/core'
import i18n from '@/i18n'
import { notifyError } from '@/services/notify'

/**
 * Execute a list of SQL statements in a single backend transaction.
 * Any failure rolls back the whole batch.
 */
export async function executeBatch(queries: string[]): Promise<void> {
  if (queries.length === 0) return
  try {
    await invoke('execute_batch', { queries })
  } catch (error) {
    notifyError(i18n.global.t('common.saveError'), error)
    throw error
  }
}
