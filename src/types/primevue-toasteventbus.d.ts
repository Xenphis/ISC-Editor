// primevue/toasteventbus ships no type declarations (PrimeVue 4.5).
declare module 'primevue/toasteventbus' {
  import type { ToastMessageOptions } from 'primevue/toast'

  const ToastEventBus: {
    emit(event: 'add', message: ToastMessageOptions): void
    emit(event: 'remove-group' | 'remove-all-groups', group?: string): void
  }
  export default ToastEventBus
}
