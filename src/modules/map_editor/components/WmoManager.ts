import * as THREE from 'three'
import { ModelManager, SceneLight, TextureManager } from '@wowserhq/scene'
import type { MinimapMapInfo, WmoDoodadSet, WmoModel, WmoPlacement } from '../types'
import { MPQ_ASSET_BASE_URL, worldToTile } from '../service'
import { loadAdtWmoPlacements, loadGlobalWmoPlacements, loadWmoModel } from '../service'

/**
 * Streams WMO buildings/structures around the camera to complement
 * @wowserhq/scene's terrain, which renders neither WMOs nor water.
 *
 * Placements come from ADT tiles (outdoor world, streamed) and the WDT
 * (WMO-only maps like dungeons, loaded once). Each references a WMO whose
 * geometry (textured batches) + interior doodad sets (M2) are fetched once and
 * reused. The world transform of a placement uses @wowserhq/format's proven
 * MODF/MDDF convention so WMOs share the terrain's coordinate frame.
 *
 * Textures reuse the scene's TextureManager (BLP decoder); interior M2s reuse
 * its ModelManager.
 */

/** ADT tiles kept loaded around the camera (Chebyshev radius). WMOs are big. */
const RADIUS = 1
/** Half the map extent (34133.332 / 2), used to normalize MODF positions. */
const MAP_CORNER = 34133.332 / 2

interface LoadedWmo {
  /** Batch geometry group; cloned per placement (geometry/materials shared). */
  template: THREE.Group
  doodadSets: WmoDoodadSet[]
}

function tileKey(col: number, row: number): string {
  return `${col},${row}`
}

/** MODF/MDDF position [X,Y,Z] → world (== three) position. */
function placementPosition(p: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(MAP_CORNER - p[2], MAP_CORNER - p[0], p[1])
}

/**
 * MODF/MDDF Euler (degrees) → quaternion, replicating gl-matrix
 * `quat.fromEuler(rot.z, rot.x, rot.y + 180)` (order "zyx"), the exact
 * transform @wowserhq/format applies to placements.
 */
function placementQuaternion(rot: [number, number, number]): THREE.Quaternion {
  const half = Math.PI / 360
  const x = rot[2] * half
  const y = rot[0] * half
  const z = (rot[1] + 180) * half
  const sx = Math.sin(x)
  const cx = Math.cos(x)
  const sy = Math.sin(y)
  const cy = Math.cos(y)
  const sz = Math.sin(z)
  const cz = Math.cos(z)
  return new THREE.Quaternion(
    sx * cy * cz - cx * sy * sz,
    cx * sy * cz + sx * cy * sz,
    cx * cy * sz - sx * sy * cz,
    cx * cy * cz + sx * sy * sz,
  )
}

export class WmoManager {
  readonly root = new THREE.Group()
  readonly modelManager: ModelManager

  #textureManager: TextureManager
  #sceneLight = new SceneLight()
  #modelCache = new Map<string, Promise<LoadedWmo>>()
  #tiles = new Map<string, THREE.Object3D[]>()
  #loading = new Set<string>()
  #disposed = false
  #lastCol = Number.NaN
  #lastRow = Number.NaN
  #ownedGeometries: THREE.BufferGeometry[] = []
  #ownedMaterials: THREE.Material[] = []
  readonly #map: MinimapMapInfo

  constructor(map: MinimapMapInfo) {
    this.#map = map
    this.root.name = 'wmos'
    const host = { baseUrl: MPQ_ASSET_BASE_URL, normalizePath: true }
    this.#textureManager = new TextureManager({ host })
    // Neutral daylight for the doodads' M2 shader (the library default is a
    // strong blue diffuse), matching the directional light below.
    this.#sceneLight.sunDir.set(-0.5, -0.3, -1).normalize()
    this.#sceneLight.sunDiffuseColor.setScalar(1)
    this.#sceneLight.sunAmbientColor.setScalar(0.65)
    this.modelManager = new ModelManager({
      host,
      textureManager: this.#textureManager,
      sceneLight: this.#sceneLight,
    })

    // Sun + ambient for exterior WMO surfaces (MeshLambert). Only lit
    // materials react: interior WMO batches (MeshBasic/MOCV), the liquids
    // (MeshBasic) and the terrain (its own shader) are all unaffected.
    this.root.add(new THREE.AmbientLight(0xffffff, 0.65))
    const sun = new THREE.DirectionalLight(0xffffff, 1.1)
    sun.position.set(0.5, 0.3, 1) // direction only (parallel light toward origin)
    this.root.add(sun)
    this.root.add(sun.target)

    void this.#loadGlobal()
  }

  /**
   * Per-frame doodad work: animations, billboard bones, and the sun uniforms
   * (the scene light bakes the sun direction into view space, so it must
   * follow the camera or the light would rotate with it).
   */
  updateModels(deltaTime: number, camera: THREE.Camera): void {
    this.#sceneLight.update(camera)
    this.modelManager.update(deltaTime, camera)
  }

  /** Loads/unloads WMO placements for the camera position. */
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

  async #loadGlobal(): Promise<void> {
    let placements: WmoPlacement[]
    try {
      placements = await loadGlobalWmoPlacements(this.#map.name)
    } catch {
      return
    }
    if (this.#disposed || placements.length === 0) return
    const objects: THREE.Object3D[] = []
    await Promise.all(
      placements.map(async placement => {
        const object = await this.#instance(placement)
        if (object && !this.#disposed) {
          objects.push(object)
          this.root.add(object)
        }
      }),
    )
  }

  async #loadTile(col: number, row: number, key: string): Promise<void> {
    this.#loading.add(key)
    let placements: WmoPlacement[]
    try {
      placements = await loadAdtWmoPlacements(this.#map.name, col, row)
    } catch {
      return
    } finally {
      this.#loading.delete(key)
    }
    if (this.#disposed || !this.#isWanted(col, row)) return

    const objects: THREE.Object3D[] = []
    // Register the (possibly empty) tile up front so panning doesn't refetch.
    this.#tiles.set(key, objects)
    await Promise.all(
      placements.map(async placement => {
        const object = await this.#instance(placement)
        if (!object || this.#disposed || !this.#tiles.has(key)) return
        objects.push(object)
        this.root.add(object)
      }),
    )
  }

  /** Instantiates one placement: cloned geometry + interior doodads, placed. */
  async #instance(placement: WmoPlacement): Promise<THREE.Object3D | null> {
    let loaded: LoadedWmo
    try {
      loaded = await this.#loadModel(placement.model)
    } catch {
      return null
    }
    if (this.#disposed) return null

    const group = loaded.template.clone()
    group.position.copy(placementPosition(placement.position))
    group.quaternion.copy(placementQuaternion(placement.rotation))

    // Set 0 is the always-shown default; the placement selects one more.
    const sets = new Set<number>([0, placement.doodadSet])
    const doodads = [...sets].flatMap(i => loaded.doodadSets?.[i]?.doodads ?? [])
    if (doodads.length > 0) {
      const models = await Promise.all(
        doodads.map(d => this.modelManager.get(d.m2).catch(() => null)),
      )
      if (this.#disposed) return null
      models.forEach((model, i) => {
        const d = doodads[i]
        if (!model || !d) return
        model.frustumCulled = false
        model.position.set(d.position[0], d.position[1], d.position[2])
        model.quaternion.set(d.rotation[0], d.rotation[1], d.rotation[2], d.rotation[3])
        model.scale.setScalar(d.scale)
        group.add(model)
      })
    }
    return group
  }

  /** Builds (once) a WMO's batch-geometry template + doodad-set data. */
  #loadModel(filename: string): Promise<LoadedWmo> {
    const cached = this.#modelCache.get(filename)
    if (cached) return cached

    const promise = loadWmoModel(filename).then((model: WmoModel) => {
      const template = new THREE.Group()
      for (const batch of model.batches) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3))
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(batch.normals, 3))
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(batch.uvs, 2))
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(batch.colors, 3))
        geometry.setIndex(batch.indices)
        // Exterior groups are shaded by the scene's sun/ambient via their
        // normals; interior groups stay unlit and rely on baked MOCV. Both
        // multiply the texture by the (MOCV or white) vertex color.
        const material = batch.exterior
          ? new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: true })
          : new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true })
        // Textures decode asynchronously via the scene's BLP worker.
        this.#textureManager
          .get(batch.texture)
          .then(texture => {
            material.map = texture
            material.needsUpdate = true
          })
          .catch(() => {})
        this.#ownedGeometries.push(geometry)
        this.#ownedMaterials.push(material)
        template.add(new THREE.Mesh(geometry, material))
      }
      return { template, doodadSets: model.doodadSets }
    })
    this.#modelCache.set(filename, promise)
    return promise
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
    for (const geometry of this.#ownedGeometries) geometry.dispose()
    for (const material of this.#ownedMaterials) material.dispose()
    this.#ownedGeometries = []
    this.#ownedMaterials = []
  }
}
