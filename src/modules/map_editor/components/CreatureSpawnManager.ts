import * as THREE from 'three'
import { ModelManager, SceneLight, TextureManager } from '@wowserhq/scene'
import type { CreatureModelInfo, CreatureSpawnMarker, MinimapMapInfo } from '../types'
import { MPQ_ASSET_BASE_URL, worldToTile } from '../service'
import { loadCreatureSpawnsInBounds, resolveCreatureModels, tileWorldBounds } from '../service'

/**
 * Streams creature spawns from the world DB as real M2 models around the camera,
 * one ADT tile at a time (Chebyshev radius), mirroring `WmoManager`: crossing a
 * tile boundary loads the newly-wanted tiles and frees the ones that fell out of
 * range, so a continent never holds more than a few tiles' worth of spawns in
 * memory.
 *
 * The DB gives each spawn a world position (placed as-is: the scene is in WoW
 * coords) and a display id; the display id is resolved to an M2 path via the
 * client DBCs (`minimap_creature_models`) and instanced through the same
 * `@wowserhq/scene` ModelManager the WMO doodads use. Model resolutions are
 * cached across tiles (keyed by display id); the ModelManager caches geometry
 * and textures across instances, so N copies of one creature share GPU buffers.
 *
 * Each placed object carries `userData.spawn` so the view can raycast-select it.
 */

/** ADT tiles kept loaded around the camera (Chebyshev radius). Models are heavy. */
const RADIUS = 1

function tileKey(col: number, row: number): string {
  return `${col},${row}`
}

export class CreatureSpawnManager {
  readonly root = new THREE.Group()
  readonly modelManager: ModelManager

  #textureManager: TextureManager
  #sceneLight = new SceneLight()
  #tiles = new Map<string, THREE.Object3D[]>()
  #loading = new Set<string>()
  /** display id -> resolved model (null once we know it can't be resolved). */
  #models = new Map<number, CreatureModelInfo | null>()
  #disposed = false
  #lastCol = Number.NaN
  #lastRow = Number.NaN
  readonly #map: MinimapMapInfo
  readonly #mapId: number

  constructor(map: MinimapMapInfo, mapId: number) {
    this.#map = map
    this.#mapId = mapId
    this.root.name = 'creature-spawns'
    const host = { baseUrl: MPQ_ASSET_BASE_URL, normalizePath: true }
    this.#textureManager = new TextureManager({ host })
    // Neutral daylight for the M2 shader, matching the WMO pass (white sun,
    // gray ambient): the library default is a strong blue diffuse. The sun
    // heading mirrors WmoManager's directional light.
    this.#sceneLight.sunDir.set(-0.5, -0.3, -1).normalize()
    this.#sceneLight.sunDiffuseColor.setScalar(1)
    this.#sceneLight.sunAmbientColor.setScalar(0.65)
    this.modelManager = new ModelManager({
      host,
      textureManager: this.#textureManager,
      sceneLight: this.#sceneLight,
    })
  }

  /**
   * Per-frame model work: animations, billboard bones, and the sun uniforms
   * (the scene light bakes the sun direction into view space, so it must
   * follow the camera or the light would rotate with it).
   */
  updateModels(deltaTime: number, camera: THREE.Camera): void {
    this.#sceneLight.update(camera)
    this.modelManager.update(deltaTime, camera)
  }

  /** Loads/unloads spawn models for the camera position. */
  update(cameraX: number, cameraY: number): void {
    const { col, row } = worldToTile({ x: cameraX, y: cameraY })
    if (col === this.#lastCol && row === this.#lastRow) return
    this.#lastCol = col
    this.#lastRow = row

    const wanted = new Set<string>()
    for (let dc = -RADIUS; dc <= RADIUS; dc++) {
      for (let dr = -RADIUS; dr <= RADIUS; dr++) {
        const c = col + dc
        const r = row + dr
        if (c < this.#map.minX || c > this.#map.maxX || r < this.#map.minY || r > this.#map.maxY) {
          continue
        }
        const key = tileKey(c, r)
        wanted.add(key)
        if (!this.#tiles.has(key) && !this.#loading.has(key)) {
          void this.#loadTile(c, r, key)
        }
      }
    }

    for (const [key, objects] of this.#tiles) {
      if (!wanted.has(key)) {
        for (const obj of objects) this.root.remove(obj)
        this.#tiles.delete(key)
      }
    }
  }

  async #loadTile(col: number, row: number, key: string): Promise<void> {
    this.#loading.add(key)
    let spawns: CreatureSpawnMarker[]
    try {
      spawns = await loadCreatureSpawnsInBounds(this.#mapId, tileWorldBounds(col, row))
    } catch {
      // No DB connected, or the query failed: leave the tile unregistered so a
      // later pass can retry once a database is available.
      return
    } finally {
      this.#loading.delete(key)
    }
    if (this.#disposed || !this.#isWanted(col, row)) return

    const objects: THREE.Object3D[] = []
    // Register the (possibly empty) tile up front so panning doesn't refetch.
    this.#tiles.set(key, objects)

    // Resolve any unseen display ids for this tile in one batched call.
    await this.#ensureModels(spawns.map(s => s.display_id))
    if (this.#disposed || !this.#tiles.has(key)) return

    await Promise.all(
      spawns.map(async spawn => {
        const info = this.#models.get(spawn.display_id)
        if (!info) return
        const object = await this.#instance(spawn, info)
        if (!object || this.#disposed || !this.#tiles.has(key)) return
        object.userData.spawn = spawn
        objects.push(object)
        this.root.add(object)
      }),
    )
  }

  /** Instantiates one spawn: a ModelManager model placed in world space. */
  async #instance(spawn: CreatureSpawnMarker, info: CreatureModelInfo): Promise<THREE.Object3D | null> {
    let model: THREE.Object3D
    try {
      model = await this.modelManager.get(info.model)
    } catch {
      return null
    }
    if (this.#disposed) return null

    model.frustumCulled = false
    model.position.set(spawn.position_x, spawn.position_y, spawn.position_z)
    // WoW orientation is a yaw about world +Z (radians); a facing offset can be
    // added here if models come out rotated, as WMO placements add +180.
    model.rotation.set(0, 0, spawn.orientation)
    model.scale.setScalar(info.scale * (spawn.scale || 1))
    this.#applySkinTextures(model, info)
    return model
  }

  /**
   * Textures creature models with their display's skin variations. Creature
   * M2s reference their skins by component slot (monster skin 1-3), which
   * @wowserhq/scene's loader leaves as empty `THREE.Texture`s — those sample
   * black, so untextured creatures render as silhouettes. The empty slots are
   * recognizable by their missing image and are filled in encounter order,
   * matching the variation order for the single-skin models that make up
   * nearly all creatures.
   */
  #applySkinTextures(model: THREE.Object3D, info: CreatureModelInfo): void {
    const skins = info.textures
    if (!skins || skins.length === 0) return
    const material = (model as THREE.Mesh).material
    const materials = Array.isArray(material) ? material : [material]
    let nextSkin = 0
    for (const mat of materials) {
      const textures = (mat as THREE.RawShaderMaterial).uniforms?.textures?.value as
        | (THREE.Texture | undefined)[]
        | undefined
      if (!textures) continue
      textures.forEach((texture, slot) => {
        if (!texture || texture.image) return
        const path = skins[Math.min(nextSkin, skins.length - 1)]
        nextSkin += 1
        if (!path) return
        this.#textureManager
          .get(path)
          .then(loaded => {
            textures[slot] = loaded
            ;(mat as THREE.RawShaderMaterial).uniformsNeedUpdate = true
          })
          .catch(() => {})
      })
    }
  }

  /** Resolves (once, batched) the display ids not yet in the model cache. */
  async #ensureModels(displayIds: number[]): Promise<void> {
    const missing = [...new Set(displayIds)].filter(id => id > 0 && !this.#models.has(id))
    if (missing.length === 0) return
    let resolved: Record<number, CreatureModelInfo>
    try {
      resolved = await resolveCreatureModels(missing)
    } catch {
      // Remember the failure so we don't refetch these every tile.
      for (const id of missing) this.#models.set(id, null)
      return
    }
    for (const id of missing) {
      this.#models.set(id, resolved[id] ?? null)
    }
  }

  #isWanted(col: number, row: number): boolean {
    return Math.abs(col - this.#lastCol) <= RADIUS && Math.abs(row - this.#lastRow) <= RADIUS
  }

  dispose(): void {
    this.#disposed = true
    for (const objects of this.#tiles.values()) {
      for (const obj of objects) this.root.remove(obj)
    }
    this.#tiles.clear()
  }
}
