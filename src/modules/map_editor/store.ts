import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { MinimapMapInfo } from './types'

const STORAGE_KEY = 'mapEditor:settings'

interface PersistedState {
  clientPath: string
  lastMapId: string
  showSpawns: boolean
}

function readInitial(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>
      return {
        clientPath: typeof parsed.clientPath === 'string' ? parsed.clientPath : '',
        lastMapId: typeof parsed.lastMapId === 'string' ? parsed.lastMapId : '',
        showSpawns: typeof parsed.showSpawns === 'boolean' ? parsed.showSpawns : false,
      }
    }
  } catch {
    /* ignore corrupted storage */
  }
  return { clientPath: '', lastMapId: '', showSpawns: false }
}

/**
 * Map-editor session state. The client path and last opened map persist
 * across restarts; the map list is re-indexed from the MPQs on load.
 */
export const useMapEditorStore = defineStore('mapEditor', () => {
  const initial = readInitial()
  const clientPath = ref<string>(initial.clientPath)
  const lastMapId = ref<string>(initial.lastMapId)
  /** Show creature spawns in the 3D view (streamed around the camera). */
  const showSpawns = ref<boolean>(initial.showSpawns)
  /** Maps returned by the last successful minimap_load_client call. */
  const maps = ref<MinimapMapInfo[]>([])

  watch([clientPath, lastMapId, showSpawns], () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          clientPath: clientPath.value,
          lastMapId: lastMapId.value,
          showSpawns: showSpawns.value,
        }),
      )
    } catch {
      /* ignore storage quota errors */
    }
  })

  return { clientPath, lastMapId, showSpawns, maps }
})
