import { computed, toRef } from 'vue'
import { useMapModuleStore, getChangedFields } from '@/modules/map/store'

export function useMapFieldModifiers() {
  const store = useMapModuleStore()
  const form = store.formData
  const originalValue = toRef(store, 'originalValue')

  const changedFields = computed(() => {
    if (!originalValue.value) return []
    return getChangedFields(originalValue.value, form)
  })

  const modifiedFieldSet = computed(() => new Set(changedFields.value.map(c => c.field)))

  function isFieldModified(field: string): boolean {
    return modifiedFieldSet.value.has(field)
  }

  return {
    isFieldModified,
    changedFields,
  }
}
