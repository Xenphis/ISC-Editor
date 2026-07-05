import ToastEventBus from 'primevue/toasteventbus'
import i18n from '@/i18n'

/**
 * Report an error to the user (toast) and to the console. Usable outside
 * component setup (stores, services), unlike PrimeVue's useToast().
 */
export function notifyError(summary: string, error: unknown): void {
  console.error(summary, error)
  ToastEventBus.emit('add', {
    severity: 'error',
    summary,
    detail: error instanceof Error ? error.message : String(error),
    life: 6000,
  })
}

/**
 * Catch handler for reference-data loads: reports the failure instead of
 * silently returning the fallback, so "no data" and "query failed" stop
 * looking identical.
 */
export function reportLoadError<T>(source: string, fallback: T) {
  return (error: unknown): T => {
    notifyError(i18n.global.t('common.loadError', { source }), error)
    return fallback
  }
}
