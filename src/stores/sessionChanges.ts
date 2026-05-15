import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useNpcModuleStore } from '@/modules/npc/store'
import { useGameObjectModuleStore } from '@/modules/game_objects/store'
import { useQuestModuleStore } from '@/modules/quests/store'
import type { ModuleStore, SessionQuery } from '@/stores/moduleStore'

export type { SessionQuery }

export const useSessionChangesStore = defineStore('sessionChanges', () => {
  /** All registered module stores. Add future modules here (gameobject, items…). */
  function getModuleStores(): ModuleStore[] {
    return [
      useNpcModuleStore(),
      useGameObjectModuleStore(),
      useQuestModuleStore(),
      // useItemModuleStore(),
    ]
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
