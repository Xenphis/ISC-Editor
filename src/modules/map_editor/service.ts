import { invoke } from '@tauri-apps/api/core'
import type { LatLng } from 'leaflet'
// Type-only import: the panel lists the same wire shape the map module edits.
import type { GameTele } from '@/modules/map/types/game_tele'
import type {
  CreatureModelInfo,
  CreatureSpawnMarker,
  LiquidMesh,
  MinimapMapInfo,
  WmoModel,
  WmoPlacement,
  WorldPosition,
} from './types'

/**
 * Map-editor tile service. The Rust side (minimap.rs) indexes the client MPQs
 * and serves a slippy pyramid over the `minimap://` custom scheme; Leaflet in
 * CRS.Simple consumes it directly with latLng = (-adtRow, adtCol):
 * at the native zoom (8) one 256px tile is exactly one ADT cell.
 */

/** Size of one ADT cell in world yards. */
export const TILE_YARDS = 1600 / 3
/** The world is a 64×64 ADT grid centered on the origin. */
export const ADT_GRID_CENTER = 32
/** Zoom where 1 leaflet tile == 1 ADT cell (must match minimap.rs). */
export const NATIVE_ZOOM = 8
/** Lowest zoom pre-composed by the backend (must match minimap.rs). */
export const MIN_ZOOM = 4

/** Custom-scheme URL format differs on Windows vs. macOS/Linux. */
const IS_WINDOWS = navigator.userAgent.includes('Windows')
const TILE_HOST = IS_WINDOWS ? 'http://minimap.localhost/' : 'minimap://localhost/'
/** Raw client files served from the MPQ patch chain (3D asset streaming). */
const MPQ_HOST = IS_WINDOWS ? 'http://mpq.localhost' : 'mpq://localhost'

export function tileUrlTemplate(mapId: string): string {
  return `${TILE_HOST}${encodeURIComponent(mapId)}/{z}/{x}/{y}.png`
}

/** Base URL for @wowserhq/scene's AssetHost (it appends `/<mpq path>`). */
export const MPQ_ASSET_BASE_URL = MPQ_HOST

/** Indexes the client's minimaps; returns the maps that have tiles. */
export function loadClient(clientPath: string): Promise<MinimapMapInfo[]> {
  return invoke<MinimapMapInfo[]>('minimap_load_client', { clientPath })
}

/** World-space liquid meshes for one ADT tile (col `x`, row `y`). */
export function loadAdtLiquids(map: string, x: number, y: number): Promise<LiquidMesh> {
  return invoke<LiquidMesh>('minimap_adt_liquids', { map, x, y })
}

/** WMO placements for one ADT tile (outdoor buildings). */
export function loadAdtWmoPlacements(map: string, x: number, y: number): Promise<WmoPlacement[]> {
  return invoke<WmoPlacement[]>('minimap_adt_wmo_placements', { map, x, y })
}

/** Global WMO placements from the map's WDT (WMO-only maps: dungeons…). */
export function loadGlobalWmoPlacements(map: string): Promise<WmoPlacement[]> {
  return invoke<WmoPlacement[]>('minimap_global_wmo_placements', { map })
}

/** A WMO's geometry + interior doodad sets (WMO-local space), by root path. */
export function loadWmoModel(filename: string): Promise<WmoModel> {
  return invoke<WmoModel>('minimap_wmo_model', { filename })
}

/** Bounding box in world yards. */
export interface WorldBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/**
 * Creature spawns (DB) within a world-space box on one map. The 3D view calls
 * this per ADT tile around the camera, so big continents stream in bounded
 * chunks instead of loading every spawn. `limit` caps a pathologically dense box.
 */
export function loadCreatureSpawnsInBounds(
  map: number,
  bounds: WorldBounds,
  limit = 4000,
): Promise<CreatureSpawnMarker[]> {
  return invoke<CreatureSpawnMarker[]>('get_creature_spawns_in_bounds', {
    map,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
    limit,
  })
}

/** Teleports on one map, for the zone tables panel. `game_tele` has no zone
 * column: pass the zone's world bounds to scope the list spatially. */
export function loadGameTelesByMap(
  map: number,
  search?: string,
  limit = 500,
  bounds?: WorldBounds | null,
): Promise<GameTele[]> {
  return invoke<GameTele[]>('get_game_teles_by_map', {
    map,
    search,
    limit,
    minX: bounds?.minX,
    maxX: bounds?.maxX,
    minY: bounds?.minY,
    maxY: bounds?.maxY,
  })
}

/** World rectangle of a zone's UI map (WorldMapArea.dbc from the client);
 * null when the zone has no world map entry. Rejects while no client loaded. */
export function loadZoneWorldBounds(zoneId: number): Promise<WorldBounds | null> {
  return invoke<WorldBounds | null>('minimap_zone_bounds', { zoneId })
}

/** Creature spawns on one map, searchable. Zone scoping is spatial (the DB's
 * `creature.zoneId` is 0 on stock rows): pass the zone's world bounds. */
export function loadCreatureSpawnsByMap(
  map: number,
  search?: string,
  limit = 500,
  bounds?: WorldBounds | null,
): Promise<CreatureSpawnMarker[]> {
  return invoke<CreatureSpawnMarker[]>('get_creature_spawns_by_map', {
    map,
    search,
    limit,
    minX: bounds?.minX,
    maxX: bounds?.maxX,
    minY: bounds?.minY,
    maxY: bounds?.maxY,
  })
}

/** Resolves creature display ids to their M2 model + scale (from client DBCs). */
export function resolveCreatureModels(
  displayIds: number[],
): Promise<Record<number, CreatureModelInfo>> {
  return invoke<Record<number, CreatureModelInfo>>('minimap_creature_models', { displayIds })
}

/** ADT tile (col, row) containing a world position. */
export function worldToTile(world: WorldPosition): { col: number; row: number } {
  return {
    col: Math.floor(ADT_GRID_CENTER - world.y / TILE_YARDS),
    row: Math.floor(ADT_GRID_CENTER - world.x / TILE_YARDS),
  }
}

/** World-space bounding box of one ADT cell — the inverse of `worldToTile`. */
export function tileWorldBounds(col: number, row: number): WorldBounds {
  return {
    minX: (ADT_GRID_CENTER - (row + 1)) * TILE_YARDS,
    maxX: (ADT_GRID_CENTER - row) * TILE_YARDS,
    minY: (ADT_GRID_CENTER - (col + 1)) * TILE_YARDS,
    maxY: (ADT_GRID_CENTER - col) * TILE_YARDS,
  }
}

/**
 * World → leaflet coordinates. ADT cell indices grow east (col, from world
 * -Y) and south (row, from world -X); leaflet lat grows north, hence -row.
 */
export function worldToLatLng(world: WorldPosition): [number, number] {
  const col = ADT_GRID_CENTER - world.y / TILE_YARDS
  const row = ADT_GRID_CENTER - world.x / TILE_YARDS
  return [-row, col]
}

export function latLngToWorld(latlng: Pick<LatLng, 'lat' | 'lng'>): WorldPosition {
  return {
    x: (ADT_GRID_CENTER - -latlng.lat) * TILE_YARDS,
    y: (ADT_GRID_CENTER - latlng.lng) * TILE_YARDS,
  }
}
