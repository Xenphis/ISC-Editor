import { computed, toRef } from 'vue'
import { useQueryGenerator } from '@/composables/useQueryGenerator'
import { useTrainerStore } from '@/modules/npc/stores/trainerStore'
import type { Trainer } from '@/modules/npc/types/trainer/trainer'

export function useTrainerFieldModifiers() {
  const store = useTrainerStore()
  const form = store.formData
  const originalValue = toRef(store, 'originalValue')

  const { changedFields } = useQueryGenerator<Trainer>(
    'trainer',
    'Id',
    originalValue,
    form,
  )

  const modifiedFieldSet = computed(() => new Set(changedFields.value.map(c => c.field)))

  function isFieldModified(field: keyof Trainer): boolean {
    return modifiedFieldSet.value.has(field)
  }

  return { isFieldModified }
}
