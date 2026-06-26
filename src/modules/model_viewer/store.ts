import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ModelPreviewSource } from './types'

const STORAGE_KEY = 'modelPreview:settings'

interface PersistedState {
  source: ModelPreviewSource
  localDataPath: string
}

function readInitial(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      return {
        source: parsed.source === 'local' ? 'local' : 'online',
        localDataPath: typeof parsed.localDataPath === 'string' ? parsed.localDataPath : '',
      }
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { source: 'online', localDataPath: '' }
}

/**
 * Persisted preferences for the NPC / GameObject model preview.
 *
 * - `source`        : 'online' renders via the Wowhead CDN by display id;
 *                     'local' renders from the user's extracted client data (Phase 2).
 * - `localDataPath` : folder containing pre-extracted .m2/.skin/.blp/.dbc files.
 */
export const useModelPreviewStore = defineStore('modelPreview', () => {
  const initial = readInitial()
  const source = ref<ModelPreviewSource>(initial.source)
  const localDataPath = ref<string>(initial.localDataPath)

  watch([source, localDataPath], () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ source: source.value, localDataPath: localDataPath.value }),
      )
    } catch {
      /* ignore storage quota errors */
    }
  })

  return { source, localDataPath }
})
