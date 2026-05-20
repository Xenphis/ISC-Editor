import { defineStore } from 'pinia'
import { computed } from 'vue'
import { sessionModuleStores } from '@/modules/registry'
import type { ModuleStore, SessionQuery } from '@/stores/moduleStore'

export type { SessionQuery }

export const useSessionChangesStore = defineStore('sessionChanges', () => {
  function getModuleStores(): ModuleStore[] {
    return sessionModuleStores.map(useModuleStore => useModuleStore())
  }

  const allDiffQueries = computed<SessionQuery[]>(() => {
    const queries: SessionQuery[] = []
    for (const store of getModuleStores()) {
      queries.push(...store.getAllDiffQueries())
    }
    return queries
  })

  const globalSqlScript = computed(() => {
    return allDiffQueries.value.map(q => q.query).join('\n')
  })

  const totalChanges = computed(() => allDiffQueries.value.length)

  return {
    allDiffQueries,
    globalSqlScript,
    totalChanges,
  }
})
