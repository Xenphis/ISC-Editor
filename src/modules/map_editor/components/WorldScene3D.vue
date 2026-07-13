<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { MapManager } from '@wowserhq/scene'
import type { CreatureSpawnMarker, MinimapMapInfo, PickedPosition, WorldPosition } from '../types'
import { ADT_GRID_CENTER, MPQ_ASSET_BASE_URL, TILE_YARDS } from '../service'
import { LiquidManager } from './LiquidManager'
import { WmoManager } from './WmoManager'
import { CreatureSpawnManager } from './CreatureSpawnManager'

/**
 * 3D world view built on @wowserhq/scene: terrain, doodads (M2), lighting,
 * fog and day/night cycle for 3.3.5 data, streamed from the client MPQs over
 * the `mpq://` scheme. WMO buildings are not rendered by the library (yet),
 * so cities and instances show terrain only.
 *
 * The scene uses WoW's own coordinate system (X north, Y west, Z up), which
 * is why the camera up axis is +Z.
 *
 * Controls: left-drag pans along the ground, right-drag looks around (FPS
 * style: the camera rotates in place, it never translates), wheel flies
 * forward/back; fly-cam on the keyboard (physical WASD — ZQSD on AZERTY — or
 * arrows, Space/C for up/down, Shift for speed); a right-click without drag
 * reports the world position under the pointer to the parent.
 *
 * The camera is driven directly (yaw/pitch state below) instead of through
 * @wowserhq/scene's MapControls: those orbit a pivot re-derived 30 yd ahead
 * of the camera every frame, so pitching swung the camera through a vertical
 * arc — right-drag felt like the camera moving up/down rather than rotating.
 *
 * The parent keys this component on the map id: switching maps remounts it,
 * which keeps the MapManager lifecycle trivial (one per mount).
 */

const props = defineProps<{
  map: MinimapMapInfo
  /** Starting spot (e.g. the 2D view's center); defaults to the map center. */
  initialPosition: WorldPosition | null
  /** Stream & show creature spawns as models around the camera. */
  showSpawns: boolean
  /** When true, the next terrain right-click relocates the selected spawn. */
  moveArmed: boolean
}>()

const emit = defineEmits<{
  (e: 'pick', position: PickedPosition): void
  /** A spawn model was clicked (null when clicking away deselects). */
  (e: 'select-spawn', spawn: CreatureSpawnMarker | null): void
  /** The selected spawn was dragged to a new world position (for the migration). */
  (e: 'move-spawn', move: { guid: number; x: number; y: number; z: number }): void
}>()

/** Height the camera starts at before the terrain under it is known. */
const FALLBACK_HEIGHT = 200
/** How long to keep probing for ground under the start position. */
const GROUND_PROBE_INTERVAL_MS = 400
const GROUND_PROBE_ATTEMPTS = 50

/** Fly-cam speed in yards per second; Shift multiplies it. */
const MOVE_SPEED = 100
const MOVE_BOOST = 5
/** Right-button press+release within this many pixels counts as a click. */
const CLICK_SLOP_PX = 5
/** Right-drag look sensitivity, radians per pixel. */
const LOOK_SPEED = 0.005
/** Pitch stays short of straight up/down so the +Z up vector never flips. */
const MAX_PITCH = Math.PI / 2 - 0.01
/** Left-drag pan tracks the ground at this distance ahead of the camera. */
const PAN_DISTANCE = 30
/** Wheel fly speed, yards per wheel deltaY unit (~4 yd per notch). */
const WHEEL_SPEED = 0.04

/** Physical key codes, so ZQSD works on AZERTY without a layout table. */
const KEY_FORWARD = ['KeyW', 'ArrowUp']
const KEY_BACK = ['KeyS', 'ArrowDown']
const KEY_LEFT = ['KeyA', 'ArrowLeft']
const KEY_RIGHT = ['KeyD', 'ArrowRight']
const KEY_UP = ['Space', 'PageUp']
const KEY_DOWN = ['KeyC', 'PageDown']
const MOVE_KEYS = new Set([
  ...KEY_FORWARD, ...KEY_BACK, ...KEY_LEFT, ...KEY_RIGHT, ...KEY_UP, ...KEY_DOWN,
])

const container = ref<HTMLDivElement>()
const grounded = ref(false)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let mapManager: MapManager | null = null
let liquidManager: LiquidManager | null = null
let wmoManager: WmoManager | null = null
let spawnManager: CreatureSpawnManager | null = null
let animationFrame = 0
let probeTimer: ReturnType<typeof setInterval> | undefined
let resizeObserver: ResizeObserver | undefined
let removeInputListeners: (() => void) | undefined

// Spawn selection state (a picked model + its ground ring highlight).
let selectedObject: THREE.Object3D | null = null
let selectedSpawn: CreatureSpawnMarker | null = null
let selectionRing: THREE.Mesh | null = null

const pressed = new Set<string>()

/** Creates the spawn manager and adds it to the scene (idempotent). */
function enableSpawns() {
  const mapId = props.map.mapId
  if (spawnManager || !scene || mapId == null) return
  spawnManager = new CreatureSpawnManager(props.map, mapId)
  scene.add(spawnManager.root)
}

/** Tears down the spawn manager and clears any selection. */
function disableSpawns() {
  clearSelection()
  if (!spawnManager) return
  scene?.remove(spawnManager.root)
  spawnManager.dispose()
  spawnManager = null
}

/** Walks up from a raycast hit to the object carrying `userData.spawn`. */
function spawnObjectFrom(obj: THREE.Object3D | null): THREE.Object3D | null {
  let node = obj
  while (node) {
    if ((node.userData as { spawn?: CreatureSpawnMarker }).spawn) return node
    node = node.parent
  }
  return null
}

function positionSelectionRing() {
  if (!selectionRing || !selectedObject) return
  selectionRing.position.copy(selectedObject.position)
  selectionRing.visible = true
}

function clearSelection() {
  selectedObject = null
  selectedSpawn = null
  if (selectionRing) selectionRing.visible = false
  emit('select-spawn', null)
}

/** Keys only fly the camera when focus isn't in a form control elsewhere. */
function isSceneKeyTarget(target: EventTarget | null): boolean {
  return target === document.body || (!!container.value && container.value.contains(target as Node))
}

function startPosition(): WorldPosition {
  if (props.initialPosition) {
    return props.initialPosition
  }
  const col = (props.map.minX + props.map.maxX + 1) / 2
  const row = (props.map.minY + props.map.maxY + 1) / 2
  return { x: (ADT_GRID_CENTER - row) * TILE_YARDS, y: (ADT_GRID_CENTER - col) * TILE_YARDS }
}

onMounted(() => {
  const el = container.value
  if (!el) return

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    60,
    el.clientWidth / Math.max(el.clientHeight, 1),
    1,
    2000,
  )
  camera.up.set(0, 0, 1)

  // @wowserhq/scene's SoundManager crashes on zone changes and on dispose when
  // no music ever played (stopMusic reads getVolume on an uninitialized audio
  // source). We don't want zone music anyway, so pass a no-op stub: MapManager
  // only calls setZoneMusic on it and never owns/disposes an injected manager.
  type SceneSoundManager = NonNullable<
    ConstructorParameters<typeof MapManager>[0]['soundManager']
  >
  const silentSound = { setZoneMusic() {}, dispose() {} } as unknown as SceneSoundManager

  mapManager = new MapManager({
    host: { baseUrl: MPQ_ASSET_BASE_URL, normalizePath: true },
    soundManager: silentSound,
  })
  mapManager.load(props.map.name, props.map.mapId ?? undefined)
  scene.add(mapManager.root)

  // Water isn't rendered by @wowserhq/scene; stream it from the ADT MH2O data.
  liquidManager = new LiquidManager(props.map)
  scene.add(liquidManager.root)

  // WMOs (buildings/structures) aren't rendered either; stream them too.
  wmoManager = new WmoManager(props.map)
  scene.add(wmoManager.root)

  // Creature spawns (DB) stream as models around the camera when enabled.
  // Ground ring that highlights the currently selected spawn (Z is up, so a
  // default XY-plane torus lies flat on the terrain).
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  selectionRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.35, 8, 32), ringMaterial)
  selectionRing.frustumCulled = false
  selectionRing.visible = false
  scene.add(selectionRing)
  if (props.showSpawns) enableSpawns()

  // ── Camera orientation (yaw about world +Z, pitch toward ±Z) ─────────
  // Initial view matches the old MapControls default offset (-30,-30,30):
  // heading north-west-ish (WoW +X north, +Y west), 35° below the horizon.
  let yaw = Math.PI / 4
  let pitch = Math.asin(-1 / Math.sqrt(3))
  const lookDir = new THREE.Vector3()
  const applyOrientation = () => {
    lookDir.set(
      Math.cos(pitch) * Math.cos(yaw),
      Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch),
    )
    camera.lookAt(
      camera.position.x + lookDir.x,
      camera.position.y + lookDir.y,
      camera.position.z + lookDir.z,
    )
  }

  const start = startPosition()
  camera.position.set(start.x, start.y, FALLBACK_HEIGHT)
  applyOrientation()

  // The terrain height under the start position is unknown until the first
  // areas stream in: probe with a downward ray and settle the camera on hit.
  const raycaster = new THREE.Raycaster()
  const down = new THREE.Vector3(0, 0, -1)
  let attempts = 0
  probeTimer = setInterval(() => {
    if (!mapManager) return
    attempts += 1
    raycaster.set(new THREE.Vector3(start.x, start.y, 5000), down)
    const hit = raycaster.intersectObject(mapManager.root, true)[0]
    if (hit) {
      camera.position.set(start.x, start.y, hit.point.z + 3)
      grounded.value = true
    }
    if (hit || attempts >= GROUND_PROBE_ATTEMPTS) {
      clearInterval(probeTimer)
      probeTimer = undefined
    }
  }, GROUND_PROBE_INTERVAL_MS)

  // ── Fly-cam keyboard movement ─────────────────────────────────────────
  const onKeyDown = (event: KeyboardEvent) => {
    if (!MOVE_KEYS.has(event.code) || !isSceneKeyTarget(event.target)) return
    pressed.add(event.code)
    event.preventDefault() // Space/arrows/PageDown would scroll the page
  }
  const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code)
  const onBlur = () => pressed.clear()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)

  const forward = new THREE.Vector3()
  const rightward = new THREE.Vector3()
  const movement = new THREE.Vector3()
  const some = (codes: string[]) => codes.some(code => pressed.has(code))
  const applyKeyboardMove = (dt: number) => {
    if (pressed.size === 0) return
    // Horizontal movement follows the camera heading, flattened to the
    // ground plane (Z is up in WoW space); vertical movement is world Z.
    camera.getWorldDirection(forward)
    forward.z = 0
    if (forward.lengthSq() < 1e-6) forward.set(1, 0, 0)
    forward.normalize()
    rightward.crossVectors(forward, camera.up)

    movement.set(0, 0, 0)
    if (some(KEY_FORWARD)) movement.add(forward)
    if (some(KEY_BACK)) movement.sub(forward)
    if (some(KEY_RIGHT)) movement.add(rightward)
    if (some(KEY_LEFT)) movement.sub(rightward)
    if (some(KEY_UP)) movement.z += 1
    if (some(KEY_DOWN)) movement.z -= 1
    if (movement.lengthSq() === 0) return

    const boost = pressed.has('ShiftLeft') || pressed.has('ShiftRight') ? MOVE_BOOST : 1
    movement.normalize().multiplyScalar(MOVE_SPEED * boost * dt)
    camera.position.add(movement)
  }

  // ── Right-click → world position under the pointer ───────────────────
  // Raycast on button-2 release without drag (right-drag looks around). The
  // contextmenu event can't be used for the click test: macOS fires it on
  // press, before a drag can be told apart.
  let rightDown: { x: number; y: number } | null = null
  let leftDown: { x: number; y: number } | null = null
  const pickCoords = new THREE.Vector2()

  const setPickCoords = (event: PointerEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    pickCoords.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  // ── Mouse look / pan / fly ────────────────────────────────────────────
  // Right-drag rotates the camera in place; left-drag pans on the ground
  // plane (the scene follows the cursor); the wheel flies along the view
  // direction. Drag state doubles as the click-slop anchor for picking.
  let dragButton = -1
  let lastPointer: { x: number; y: number } | null = null

  const onPointerDown = (event: PointerEvent) => {
    if (event.button === 2) rightDown = { x: event.clientX, y: event.clientY }
    else if (event.button === 0) leftDown = { x: event.clientX, y: event.clientY }
    if (event.button === 0 || event.button === 2) {
      dragButton = event.button
      lastPointer = { x: event.clientX, y: event.clientY }
      ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!lastPointer) return
    const dx = event.clientX - lastPointer.x
    const dy = event.clientY - lastPointer.y
    lastPointer = { x: event.clientX, y: event.clientY }
    if (dragButton === 2 && (event.buttons & 2) !== 0) {
      yaw -= dx * LOOK_SPEED
      pitch = THREE.MathUtils.clamp(pitch - dy * LOOK_SPEED, -MAX_PITCH, MAX_PITCH)
      applyOrientation()
    } else if (dragButton === 0 && (event.buttons & 1) !== 0) {
      // World yards per pixel so the ground PAN_DISTANCE ahead tracks the
      // cursor; directions from yaw only, so panning still works looking down.
      const height = renderer?.domElement.clientHeight || 1
      const scale = (2 * PAN_DISTANCE * Math.tan((camera.fov * Math.PI) / 360)) / height
      const rightX = Math.sin(yaw)
      const rightY = -Math.cos(yaw)
      camera.position.x += (-dx * rightX + dy * Math.cos(yaw)) * scale
      camera.position.y += (-dx * rightY + dy * Math.sin(yaw)) * scale
    }
  }

  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    camera.position.addScaledVector(lookDir, -event.deltaY * WHEEL_SPEED)
  }

  // Left-click without drag selects the spawn model under the pointer
  // (left-drag pans); clicking empty space deselects.
  const onLeftClick = (event: PointerEvent) => {
    if (!leftDown) return
    const moved = Math.hypot(event.clientX - leftDown.x, event.clientY - leftDown.y)
    leftDown = null
    if (moved > CLICK_SLOP_PX || !spawnManager) return
    setPickCoords(event)
    raycaster.setFromCamera(pickCoords, camera)
    const hit = raycaster.intersectObject(spawnManager.root, true)[0]
    const object = hit ? spawnObjectFrom(hit.object) : null
    if (object) {
      selectedObject = object
      selectedSpawn = object.userData.spawn as CreatureSpawnMarker
      positionSelectionRing()
      emit('select-spawn', selectedSpawn)
    } else {
      clearSelection()
    }
  }

  // Right-click without drag: relocate the selected spawn when move is armed,
  // else report the world position under the pointer (right-drag looks).
  const onRightClick = (event: PointerEvent) => {
    if (!rightDown) return
    const moved = Math.hypot(event.clientX - rightDown.x, event.clientY - rightDown.y)
    rightDown = null
    if (moved > CLICK_SLOP_PX || !mapManager) return
    setPickCoords(event)
    raycaster.setFromCamera(pickCoords, camera)
    const hit = raycaster.intersectObject(mapManager.root, true)[0]
    if (!hit) return
    if (props.moveArmed && selectedObject && selectedSpawn) {
      selectedObject.position.set(hit.point.x, hit.point.y, hit.point.z)
      positionSelectionRing()
      emit('move-spawn', { guid: selectedSpawn.guid, x: hit.point.x, y: hit.point.y, z: hit.point.z })
      return
    }
    emit('pick', { x: hit.point.x, y: hit.point.y, z: hit.point.z })
  }

  const onPointerUp = (event: PointerEvent) => {
    if (event.button === dragButton) {
      dragButton = -1
      lastPointer = null
    }
    if (event.button === 0) onLeftClick(event)
    else if (event.button === 2) onRightClick(event)
  }
  const onContextMenu = (event: Event) => event.preventDefault()
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
  renderer.domElement.addEventListener('contextmenu', onContextMenu)

  removeInputListeners = () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
    renderer?.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer?.domElement.removeEventListener('pointermove', onPointerMove)
    renderer?.domElement.removeEventListener('pointerup', onPointerUp)
    renderer?.domElement.removeEventListener('wheel', onWheel)
    renderer?.domElement.removeEventListener('contextmenu', onContextMenu)
    pressed.clear()
  }

  const clock = new THREE.Clock()
  const animate = () => {
    animationFrame = requestAnimationFrame(animate)
    if (!renderer || !mapManager || !scene) return
    const dt = clock.getDelta()
    applyKeyboardMove(dt)
    // Refresh the camera matrices BEFORE the managers run: skinned M2s
    // (creatures, animated doodads) bake camera.matrixWorldInverse into
    // their bone textures, and the renderer only recomputes it during
    // render() — one frame too late, which made models trail the camera
    // while moving and visibly snap back into place on stop.
    camera.updateMatrixWorld()
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert()
    mapManager.setTarget(camera.position.x, camera.position.y)
    mapManager.update(dt, camera)
    liquidManager?.update(camera.position.x, camera.position.y)
    wmoManager?.update(camera.position.x, camera.position.y)
    wmoManager?.updateModels(dt, camera)
    spawnManager?.update(camera.position.x, camera.position.y)
    spawnManager?.updateModels(dt, camera)
    if (camera.far !== mapManager.cameraFar) {
      camera.far = mapManager.cameraFar
      camera.updateProjectionMatrix()
    }
    renderer.setClearColor(mapManager.clearColor)
    renderer.render(scene, camera)
  }
  animate()

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !el.clientWidth || !el.clientHeight) return
    renderer.setSize(el.clientWidth, el.clientHeight)
    camera.aspect = el.clientWidth / el.clientHeight
    camera.updateProjectionMatrix()
  })
  resizeObserver.observe(el)
})

// Toggling the toolbar switch streams spawns in or tears them down live.
watch(() => props.showSpawns, show => (show ? enableSpawns() : disableSpawns()))

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  if (probeTimer !== undefined) clearInterval(probeTimer)
  resizeObserver?.disconnect()
  removeInputListeners?.()
  liquidManager?.dispose()
  wmoManager?.dispose()
  spawnManager?.dispose()
  mapManager?.dispose()
  if (selectionRing) {
    selectionRing.geometry.dispose()
    ;(selectionRing.material as THREE.Material).dispose()
  }
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  renderer = null
  scene = null
  mapManager = null
  liquidManager = null
  wmoManager = null
  spawnManager = null
  selectionRing = null
  selectedObject = null
  selectedSpawn = null
})
</script>

<template>
  <div ref="container" class="world-scene">
    <div v-if="!grounded" class="scene-hint">
      <i class="pi pi-spin pi-spinner"></i>
      <span>{{ $t('mapEditor.scene.streaming') }}</span>
    </div>
    <div class="scene-controls-hint">{{ $t('mapEditor.scene.controls') }}</div>
  </div>
</template>

<style scoped>
.world-scene {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 0.75rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  overflow: hidden;
  background: #060d1f;
}

.world-scene :deep(canvas) {
  display: block;
}

.scene-hint {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.85);
  color: #94a3b8;
  font-size: 0.85rem;
  pointer-events: none;
}

.scene-controls-hint {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  color: rgba(148, 163, 184, 0.8);
  font-size: 0.75rem;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
