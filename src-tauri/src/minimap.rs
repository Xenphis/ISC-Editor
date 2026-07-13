use std::collections::hash_map::DefaultHasher;
use std::collections::{HashMap, VecDeque};
use std::hash::{Hash, Hasher};
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Condvar, Mutex, MutexGuard};
use std::time::{Duration, UNIX_EPOCH};

use image::imageops::FilterType;
use serde::{Deserialize, Serialize};
use tauri::http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, CACHE_CONTROL, CONTENT_TYPE};
use tauri::http::{Request, Response};
use tauri::Manager;
use wow_mpq::PatchChain;

use crate::liquids::{build_tile_liquids, LiquidMesh};
use crate::wmo::{adt_wmo_placements, build_model, to_m2_path, wdt_wmo_placements, WmoModel, WmoPlacement};

/// Minimap tile pipeline for the map editor.
///
/// The 3.3.5 client stores one 256×256 minimap texture per ADT cell (64×64
/// grid, 533.33333 yd per cell), as content-hashed BLPs under
/// `textures\minimap\` with `md5translate.trs` mapping plain names
/// (`Azeroth\map30_48.blp`) to hashes. This module opens the client MPQs as a
/// patch chain, indexes that mapping, and serves a slippy tile pyramid over
/// the `minimap://` scheme: zoom 8 is 1 leaflet tile = 1 ADT cell, lower
/// zooms are composed from their four children. Everything is cached as PNG
/// on disk (app cache dir), including misses (empty files), because most of
/// the 64×64 grid is ocean without minimaps.
///
/// Opening the MPQ chain can't persist across launches (it's in-memory), so
/// to keep startup snappy the map list is cached on disk keyed by a signature
/// of the client's archives: an unchanged client returns its list instantly
/// while the chain is (re)opened on a background thread; tile/asset requests
/// that arrive before it's ready simply wait.

/// Native zoom: leaflet tile (x, y) == ADT cell (x, y).
const TILE_ZOOM: u32 = 8;
/// Lowest zoom served (16×16 ADT cells per tile).
const MIN_ZOOM: u32 = 4;
const TILE_SIZE: u32 = 256;

/// Cap of the in-memory MPQ read cache (raw, still-compressed-on-disk assets
/// decompressed once and reused across 3D re-opens within a session).
const READ_CACHE_BYTES: usize = 128 * 1024 * 1024;
/// How long a tile/asset request waits for a background chain open.
const OPEN_WAIT: Duration = Duration::from_secs(30);

pub struct MinimapState {
    inner: Mutex<StateInner>,
    /// Signalled when a background open finishes (success or failure).
    ready: Condvar,
}

#[derive(Default)]
struct StateInner {
    data: Option<MinimapData>,
    /// A background chain open is in progress; requests should wait, not 503.
    opening: bool,
}

impl MinimapState {
    pub fn new() -> Self {
        Self { inner: Mutex::new(StateInner::default()), ready: Condvar::new() }
    }
}

pub struct MinimapData {
    chain: PatchChain,
    /// Key: lowercased map directory name from md5translate.trs.
    maps: HashMap<String, MapEntry>,
    cache_dir: PathBuf,
    read_cache: ReadCache,
    /// LiquidType.dbc id -> type code, parsed lazily on first liquid request.
    liquid_types: Option<HashMap<u16, u8>>,
    /// CreatureDisplayInfo/ModelData.dbc: display id -> M2 model + scale, built
    /// lazily on the first creature-spawn request (empty if the DBCs are gone).
    creature_models: Option<HashMap<u32, CreatureModelInfo>>,
}

/// The client asset needed to render one creature display: the `.m2` model path
/// (over the `mpq://` scheme) and the combined DBC display/model scale.
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreatureModelInfo {
    pub model: String,
    pub scale: f32,
    /// Skin BLPs from CreatureDisplayInfo's TextureVariation fields, resolved
    /// to full paths next to the model (monster skins 1-3, empties dropped).
    /// The M2's own texture list only names these by component slot, so a
    /// renderer needs them to texture the creature at all.
    pub textures: Vec<String>,
}

impl MinimapData {
    /// Reads a raw file from the chain, memoizing the decompressed bytes.
    fn read_cached(&mut self, path: &str) -> Result<Arc<Vec<u8>>, String> {
        self.read_cache.get_or_read(&mut self.chain, path)
    }

    /// LiquidType categories, parsed from the DBC on first use (empty if the
    /// DBC is missing — the builder then defaults everything to water).
    fn liquid_types(&mut self) -> &HashMap<u16, u8> {
        if self.liquid_types.is_none() {
            let types = match self.chain.read_file("DBFilesClient\\LiquidType.dbc") {
                Ok(bytes) => crate::liquids::parse_liquid_types(&bytes),
                Err(e) => {
                    log::warn!("minimap: LiquidType.dbc unavailable, liquids uncategorized: {e}");
                    HashMap::new()
                }
            };
            self.liquid_types = Some(types);
        }
        self.liquid_types.as_ref().unwrap()
    }

    /// Creature display id -> renderable model, built once by composing
    /// CreatureDisplayInfo.dbc and CreatureModelData.dbc. Empty if either DBC
    /// is missing (creatures then simply don't render).
    fn creature_models(&mut self) -> &HashMap<u32, CreatureModelInfo> {
        if self.creature_models.is_none() {
            let display = self.chain.read_file("DBFilesClient\\CreatureDisplayInfo.dbc");
            let model = self.chain.read_file("DBFilesClient\\CreatureModelData.dbc");
            let resolved = match (display, model) {
                (Ok(d), Ok(m)) => build_creature_models(&d, &m),
                _ => {
                    log::warn!("minimap: CreatureDisplayInfo/ModelData.dbc unavailable, creatures unresolved");
                    HashMap::new()
                }
            };
            self.creature_models = Some(resolved);
        }
        self.creature_models.as_ref().unwrap()
    }
}

struct MapEntry {
    /// Directory name with original casing, used as display name.
    name: String,
    /// Map.dbc id, when the directory matched a record (drives lighting in 3D).
    map_id: Option<u32>,
    /// ADT cell (x, y) -> full MPQ path of the hashed BLP.
    tiles: HashMap<(u32, u32), String>,
}

/// FIFO, byte-bounded cache of raw MPQ reads. FIFO (not true LRU) is enough:
/// the 3D scene fetches each asset a bounded number of times per session, and
/// the point is to skip re-decompressing them from big patch archives after a
/// component remount (2D↔3D toggle, map switch and back).
#[derive(Default)]
struct ReadCache {
    entries: HashMap<String, Arc<Vec<u8>>>,
    order: VecDeque<String>,
    bytes: usize,
}

impl ReadCache {
    fn get_or_read(
        &mut self,
        chain: &mut PatchChain,
        path: &str,
    ) -> Result<Arc<Vec<u8>>, String> {
        let key = path.to_ascii_lowercase();
        if let Some(hit) = self.entries.get(&key) {
            return Ok(hit.clone());
        }
        let bytes = chain.read_file(path).map_err(|e| e.to_string())?;
        let arc = Arc::new(bytes);
        self.bytes += arc.len();
        self.order.push_back(key.clone());
        self.entries.insert(key, arc.clone());
        while self.bytes > READ_CACHE_BYTES && self.order.len() > 1 {
            if let Some(old) = self.order.pop_front() {
                if let Some(evicted) = self.entries.remove(&old) {
                    self.bytes -= evicted.len();
                }
            }
        }
        Ok(arc)
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MapInfo {
    pub id: String,
    pub name: String,
    pub map_id: Option<u32>,
    pub tile_count: usize,
    pub min_x: u32,
    pub max_x: u32,
    pub min_y: u32,
    pub max_y: u32,
}

/// On-disk map-list cache, invalidated when the archive signature changes.
#[derive(Serialize, Deserialize)]
struct CachedIndex {
    signature: String,
    maps: Vec<MapInfo>,
}

/// Indexes the client's minimaps. `client_path` is the WoW root or its `Data`
/// folder. Returns the available maps, sorted by name.
///
/// Fast path: when a cached index matches the client's current archives, it's
/// returned at once and the chain is opened on a background thread. Otherwise
/// the chain is opened synchronously, the index built and cached.
#[tauri::command]
pub async fn minimap_load_client(
    app: tauri::AppHandle,
    client_path: String,
) -> Result<Vec<MapInfo>, String> {
    let base_cache = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("cache dir unavailable: {e}"))?
        .join("minimap-tiles");
    let index_path = base_cache.join("index.json");

    // Cheap: no archive is opened to compute the signature.
    let data_dir = resolve_data_dir(&client_path)?;
    let archives = discover_archives(&data_dir)?;
    let signature = archives_signature(&archives);
    // Tiles live under the signature so patched data never serves stale tiles.
    let cache_dir = base_cache.join(&signature);

    if let Some(maps) = read_cached_index(&index_path, &signature) {
        begin_background_open(app.clone(), archives, cache_dir);
        return Ok(maps);
    }

    let build_cache_dir = cache_dir.clone();
    let data = tauri::async_runtime::spawn_blocking(move || build_data(archives, build_cache_dir))
        .await
        .map_err(|e| e.to_string())??;

    let infos = map_infos(&data);
    write_cached_index(&index_path, &signature, &infos);
    prune_old_caches(&base_cache, &signature);

    let state = app.state::<MinimapState>();
    let mut inner = state.inner.lock().unwrap();
    inner.data = Some(data);
    inner.opening = false;
    state.ready.notify_all();
    Ok(infos)
}

/// Extracts the 3D water meshes for one ADT tile, in world coordinates.
/// `map` is the map directory (e.g. "Azeroth"); `x`/`y` are the ADT tile
/// (col/row), same numbering as the minimap tiles. Result is cached on disk.
#[tauri::command]
pub async fn minimap_adt_liquids(
    app: tauri::AppHandle,
    map: String,
    x: u32,
    y: u32,
) -> Result<LiquidMesh, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<MinimapState>();
        let Some(mut inner) = wait_for_data(&state) else {
            return Err("client not loaded".to_string());
        };
        let data = inner.data.as_mut().unwrap();

        let cache_path = data
            .cache_dir
            .join("liquids")
            .join(map.to_ascii_lowercase())
            .join(format!("{x}_{y}.json"));
        if let Ok(bytes) = std::fs::read(&cache_path) {
            if let Ok(mesh) = serde_json::from_slice::<LiquidMesh>(&bytes) {
                return Ok(mesh);
            }
        }

        // Same path the 3D scene streams, so this hits the shared read cache.
        let adt_path = format!("world\\maps\\{map}\\{map}_{x}_{y}.adt");
        let adt_bytes = match data.read_cached(&adt_path) {
            Ok(bytes) => bytes,
            // A missing ADT (ocean-only tile edge) is "no liquid", not an error.
            Err(_) => return Ok(LiquidMesh::default()),
        };

        // Borrow the liquid types first (mutable), then the bytes are already
        // an owned Arc, so no aliasing with &mut data.
        let types = data.liquid_types().clone();
        let mesh = build_tile_liquids(&adt_bytes, x, y, &types)?;

        if let Some(parent) = cache_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Ok(json) = serde_json::to_vec(&mesh) {
            let _ = std::fs::write(&cache_path, json);
        }
        Ok(mesh)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// WMO placements for one ADT tile (outdoor buildings). Result cached on disk.
#[tauri::command]
pub async fn minimap_adt_wmo_placements(
    app: tauri::AppHandle,
    map: String,
    x: u32,
    y: u32,
) -> Result<Vec<WmoPlacement>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<MinimapState>();
        let Some(mut inner) = wait_for_data(&state) else {
            return Err("client not loaded".to_string());
        };
        let data = inner.data.as_mut().unwrap();

        let cache_path = data
            .cache_dir
            .join("wmo/placements")
            .join(map.to_ascii_lowercase())
            .join(format!("{x}_{y}.json"));
        if let Ok(bytes) = std::fs::read(&cache_path) {
            if let Ok(p) = serde_json::from_slice::<Vec<WmoPlacement>>(&bytes) {
                return Ok(p);
            }
        }

        let adt_path = format!("world\\maps\\{map}\\{map}_{x}_{y}.adt");
        let placements = match data.read_cached(&adt_path) {
            Ok(bytes) => adt_wmo_placements(&bytes),
            Err(_) => Vec::new(), // missing ADT (ocean edge) = no buildings
        };
        write_json_cache(&cache_path, &placements);
        Ok(placements)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Global WMO placements from the map's WDT (WMO-only maps: dungeons…).
#[tauri::command]
pub async fn minimap_global_wmo_placements(
    app: tauri::AppHandle,
    map: String,
) -> Result<Vec<WmoPlacement>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<MinimapState>();
        let Some(mut inner) = wait_for_data(&state) else {
            return Err("client not loaded".to_string());
        };
        let data = inner.data.as_mut().unwrap();

        let wdt_path = format!("world\\maps\\{map}\\{map}.wdt");
        let placements = match data.read_cached(&wdt_path) {
            Ok(bytes) => wdt_wmo_placements(&bytes),
            Err(_) => Vec::new(),
        };
        Ok(placements)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// A WMO's geometry + interior doodad sets (WMO-local space). Cached on disk;
/// referenced by many placements/tiles, so keyed on the WMO path only.
#[tauri::command]
pub async fn minimap_wmo_model(
    app: tauri::AppHandle,
    filename: String,
) -> Result<WmoModel, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<MinimapState>();
        let Some(mut inner) = wait_for_data(&state) else {
            return Err("client not loaded".to_string());
        };
        let data = inner.data.as_mut().unwrap();

        let flat = filename.to_ascii_lowercase().replace(['\\', '/'], "_");
        let cache_path = data.cache_dir.join("wmo/models").join(format!("{flat}.json"));
        if let Ok(bytes) = std::fs::read(&cache_path) {
            if let Ok(model) = serde_json::from_slice::<WmoModel>(&bytes) {
                return Ok(model);
            }
        }

        let model = build_model(&filename, |path| {
            data.read_cached(path).map(|bytes| bytes.as_ref().clone())
        })?;
        write_json_cache(&cache_path, &model);
        Ok(model)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Resolves creature display ids to their M2 model + scale. The client sends the
/// distinct display ids around the camera; the DBC pair is parsed once and
/// cached, so repeat calls (tile after tile) are just map lookups. Unknown ids
/// are omitted from the result.
#[tauri::command]
pub async fn minimap_creature_models(
    app: tauri::AppHandle,
    display_ids: Vec<u32>,
) -> Result<HashMap<u32, CreatureModelInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<MinimapState>();
        let Some(mut inner) = wait_for_data(&state) else {
            return Err("client not loaded".to_string());
        };
        let data = inner.data.as_mut().unwrap();
        let models = data.creature_models();
        let mut out = HashMap::with_capacity(display_ids.len());
        for id in display_ids {
            if let Some(info) = models.get(&id) {
                out.insert(id, info.clone());
            }
        }
        Ok(out)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn write_json_cache<T: serde::Serialize>(cache_path: &std::path::Path, value: &T) {
    if let Some(parent) = cache_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_vec(value) {
        let _ = std::fs::write(cache_path, json);
    }
}

/// Opens the chain on a background thread, publishing it into the shared state
/// when done. Requests wait via `wait_for_data` until then.
fn begin_background_open(app: tauri::AppHandle, archives: Vec<(PathBuf, i32)>, cache_dir: PathBuf) {
    {
        let state = app.state::<MinimapState>();
        let mut inner = state.inner.lock().unwrap();
        inner.data = None;
        inner.opening = true;
    }
    std::thread::spawn(move || {
        let result = build_data(archives, cache_dir);
        let state = app.state::<MinimapState>();
        let mut inner = state.inner.lock().unwrap();
        match result {
            Ok(data) => inner.data = Some(data),
            Err(e) => log::error!("minimap: background client open failed: {e}"),
        }
        inner.opening = false;
        state.ready.notify_all();
    });
}

/// Locks the state and returns a guard once the chain is available, waiting
/// out any in-progress background open. `None` means no client is loaded (or
/// the open failed / timed out).
fn wait_for_data(state: &MinimapState) -> Option<MutexGuard<'_, StateInner>> {
    let mut inner = state.inner.lock().unwrap();
    loop {
        if inner.data.is_some() {
            return Some(inner);
        }
        if !inner.opening {
            return None;
        }
        let (guard, timeout) = state.ready.wait_timeout(inner, OPEN_WAIT).unwrap();
        inner = guard;
        if timeout.timed_out() && inner.data.is_none() {
            return None;
        }
    }
}

fn map_infos(data: &MinimapData) -> Vec<MapInfo> {
    let mut infos: Vec<MapInfo> = data
        .maps
        .iter()
        .filter(|(_, entry)| !entry.tiles.is_empty())
        .map(|(id, entry)| {
            let xs = entry.tiles.keys().map(|&(x, _)| x);
            let ys = entry.tiles.keys().map(|&(_, y)| y);
            MapInfo {
                id: id.clone(),
                name: entry.name.clone(),
                map_id: entry.map_id,
                tile_count: entry.tiles.len(),
                min_x: xs.clone().min().unwrap_or(0),
                max_x: xs.max().unwrap_or(0),
                min_y: ys.clone().min().unwrap_or(0),
                max_y: ys.max().unwrap_or(0),
            }
        })
        .collect();
    infos.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    infos
}

fn build_data(archives: Vec<(PathBuf, i32)>, cache_dir: PathBuf) -> Result<MinimapData, String> {
    let mut chain = open_chain(archives)?;

    let trs = chain
        .read_file("textures\\minimap\\md5translate.trs")
        .map_err(|e| format!("md5translate.trs not found in the client MPQs: {e}"))?;
    let trs = String::from_utf8_lossy(&trs);

    // Directory (lowercased) -> (id, Directory) from Map.dbc; ids drive the
    // 3D view's per-map lighting, exact casing gives nicer display names.
    let dbc_index = match chain.read_file("DBFilesClient\\Map.dbc") {
        Ok(bytes) => parse_map_dbc(&bytes).unwrap_or_default(),
        Err(e) => {
            log::warn!("minimap: Map.dbc unavailable, map ids unknown: {e}");
            HashMap::new()
        }
    };

    let mut maps: HashMap<String, MapEntry> = HashMap::new();
    for line in trs.lines() {
        let Some((plain, hashed)) = line.trim_end_matches('\r').split_once('\t') else {
            continue; // "dir: X" section headers and blank lines
        };
        let Some((dir_path, file)) = plain.rsplit_once('\\') else {
            continue;
        };
        // WMO minimaps ("WMO\...") have nested paths and non-mapX_Y names;
        // parse_tile_name filters them out along with noLiquid variants.
        let Some(cell) = parse_tile_name(&file.to_ascii_lowercase()) else {
            continue;
        };
        let map_dir = dir_path.rsplit('\\').next().unwrap_or(dir_path);
        let key = map_dir.to_ascii_lowercase();
        let entry = maps.entry(key).or_insert_with_key(|key| {
            let dbc = dbc_index.get(key);
            MapEntry {
                name: dbc.map(|(_, dir)| dir.clone()).unwrap_or_else(|| map_dir.to_string()),
                map_id: dbc.map(|&(id, _)| id),
                tiles: HashMap::new(),
            }
        });
        entry
            .tiles
            .insert(cell, format!("textures\\minimap\\{}", hashed.trim()));
    }

    if maps.is_empty() {
        return Err("md5translate.trs contained no map tiles".into());
    }

    Ok(MinimapData {
        chain,
        maps,
        cache_dir,
        read_cache: ReadCache::default(),
        liquid_types: None,
        creature_models: None,
    })
}

/// Minimal WDBC reader for Map.dbc: field 0 is the map id, field 1 the
/// Directory string. Returns lowercased-directory -> (id, Directory).
fn parse_map_dbc(bytes: &[u8]) -> Option<HashMap<String, (u32, String)>> {
    let u32_at = |offset: usize| -> Option<u32> {
        Some(u32::from_le_bytes(bytes.get(offset..offset + 4)?.try_into().ok()?))
    };
    if bytes.get(..4)? != b"WDBC" {
        return None;
    }
    let record_count = u32_at(4)? as usize;
    let record_size = u32_at(12)? as usize;
    let strings_start = 20 + record_count * record_size;
    if record_size < 8 || bytes.len() < strings_start {
        return None;
    }

    let mut index = HashMap::new();
    for record in 0..record_count {
        let base = 20 + record * record_size;
        let id = u32_at(base)?;
        let dir_offset = strings_start + u32_at(base + 4)? as usize;
        let dir_bytes = bytes.get(dir_offset..)?;
        let end = dir_bytes.iter().position(|&b| b == 0)?;
        let dir = String::from_utf8_lossy(&dir_bytes[..end]).into_owned();
        if !dir.is_empty() {
            index.insert(dir.to_ascii_lowercase(), (id, dir));
        }
    }
    Some(index)
}

/// Composes the two creature DBCs into display id -> renderable model. Field
/// layout is 3.3.5a (build 12340): CreatureDisplayInfo field 1 = ModelID and
/// field 4 = CreatureModelScale; CreatureModelData field 2 = ModelName string
/// and field 4 = ModelScale. The two scales multiply; `creature_template.scale`
/// is applied on the client.
fn build_creature_models(display_bytes: &[u8], model_bytes: &[u8]) -> HashMap<u32, CreatureModelInfo> {
    let displays = parse_creature_display_info(display_bytes).unwrap_or_default();
    let models = parse_creature_model_data(model_bytes).unwrap_or_default();
    let mut out = HashMap::with_capacity(displays.len());
    for (display_id, (model_data_id, display_scale, variations)) in displays {
        if let Some((path, model_scale)) = models.get(&model_data_id) {
            if path.is_empty() {
                continue;
            }
            // TextureVariation entries are bare file names living next to the M2.
            let dir = &path[..path.rfind(['\\', '/']).map_or(0, |i| i + 1)];
            let textures = variations
                .iter()
                .filter(|v| !v.is_empty())
                .map(|v| format!("{dir}{v}.blp"))
                .collect();
            out.insert(
                display_id,
                CreatureModelInfo {
                    model: path.clone(),
                    scale: display_scale * model_scale,
                    textures,
                },
            );
        }
    }
    out
}

/// CreatureDisplayInfo.dbc: field 0 = id, field 1 = CreatureModelData id,
/// field 4 = CreatureModelScale, fields 6-8 = TextureVariation (bare skin BLP
/// names, no path/extension). Returns id -> (model-data id, scale, variations).
/// Only fixed field offsets are read, so trailing fields don't matter.
fn parse_creature_display_info(bytes: &[u8]) -> Option<HashMap<u32, (u32, f32, [String; 3])>> {
    let u32_at = |offset: usize| -> Option<u32> {
        Some(u32::from_le_bytes(bytes.get(offset..offset + 4)?.try_into().ok()?))
    };
    let f32_at = |offset: usize| -> Option<f32> {
        Some(f32::from_le_bytes(bytes.get(offset..offset + 4)?.try_into().ok()?))
    };
    if bytes.get(..4)? != b"WDBC" {
        return None;
    }
    let record_count = u32_at(4)? as usize;
    let record_size = u32_at(12)? as usize;
    let strings_start = 20 + record_count * record_size;
    if record_size < 20 || bytes.len() < strings_start {
        return None;
    }
    let string_at = |offset: usize| -> Option<String> {
        let tail = bytes.get(strings_start + u32_at(offset)? as usize..)?;
        let end = tail.iter().position(|&b| b == 0).unwrap_or(tail.len());
        Some(String::from_utf8_lossy(&tail[..end]).into_owned())
    };
    let mut index = HashMap::with_capacity(record_count);
    for record in 0..record_count {
        let base = 20 + record * record_size;
        let id = u32_at(base)?;
        let model_data_id = u32_at(base + 4)?;
        let scale = f32_at(base + 16).filter(|s| *s > 0.0).unwrap_or(1.0);
        let mut variations: [String; 3] = Default::default();
        if record_size >= 36 {
            for (i, variation) in variations.iter_mut().enumerate() {
                *variation = string_at(base + 24 + i * 4).unwrap_or_default();
            }
        }
        index.insert(id, (model_data_id, scale, variations));
    }
    Some(index)
}

/// CreatureModelData.dbc: field 0 = id, field 2 = ModelName (string-block
/// offset, a `.mdx` path), field 4 = ModelScale. Returns id -> (m2 path, scale).
fn parse_creature_model_data(bytes: &[u8]) -> Option<HashMap<u32, (String, f32)>> {
    let u32_at = |offset: usize| -> Option<u32> {
        Some(u32::from_le_bytes(bytes.get(offset..offset + 4)?.try_into().ok()?))
    };
    let f32_at = |offset: usize| -> Option<f32> {
        Some(f32::from_le_bytes(bytes.get(offset..offset + 4)?.try_into().ok()?))
    };
    if bytes.get(..4)? != b"WDBC" {
        return None;
    }
    let record_count = u32_at(4)? as usize;
    let record_size = u32_at(12)? as usize;
    let strings_start = 20 + record_count * record_size;
    if record_size < 20 || bytes.len() < strings_start {
        return None;
    }
    let mut index = HashMap::with_capacity(record_count);
    for record in 0..record_count {
        let base = 20 + record * record_size;
        let id = u32_at(base)?;
        let name_offset = strings_start + u32_at(base + 8)? as usize;
        let name_bytes = bytes.get(name_offset..)?;
        let end = name_bytes.iter().position(|&b| b == 0).unwrap_or(name_bytes.len());
        let raw = String::from_utf8_lossy(&name_bytes[..end]).into_owned();
        let path = if raw.is_empty() { String::new() } else { to_m2_path(&raw) };
        let scale = f32_at(base + 16).filter(|s| *s > 0.0).unwrap_or(1.0);
        index.insert(id, (path, scale));
    }
    Some(index)
}

/// `mapX_Y.blp` -> (X, Y). Expects a lowercased name; anything else (noLiquid
/// variants, WMO minimaps) yields None.
fn parse_tile_name(file: &str) -> Option<(u32, u32)> {
    let rest = file.strip_suffix(".blp")?.strip_prefix("map")?;
    let (x, y) = rest.split_once('_')?;
    Some((x.parse().ok()?, y.parse().ok()?))
}

/// Resolves the client's `Data` folder from a WoW root or the folder itself.
fn resolve_data_dir(client_path: &str) -> Result<PathBuf, String> {
    let root = Path::new(client_path);
    if root.join("Data").is_dir() {
        Ok(root.join("Data"))
    } else if root.is_dir() {
        Ok(root.to_path_buf())
    } else {
        Err(format!("directory not found: {client_path}"))
    }
}

/// Lists the 3.3.5 archives with their patch priority (later = higher):
/// base < locale base < patch.MPQ < patch-N < locale patches. Sorted by
/// priority so `open_chain` layers them correctly.
fn discover_archives(data_dir: &Path) -> Result<Vec<(PathBuf, i32)>, String> {
    let mut archives: Vec<(PathBuf, i32)> = Vec::new();

    let entries = std::fs::read_dir(data_dir).map_err(|e| format!("{}: {e}", data_dir.display()))?;
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
        if path.is_file() && name.ends_with(".mpq") {
            if let Some(priority) = base_archive_priority(&name) {
                archives.push((path, priority));
            }
        } else if path.is_dir() {
            // Locale folder (enUS, frFR…): minimaps aren't localized, but
            // custom patches sometimes ship there.
            for sub in std::fs::read_dir(&path).into_iter().flatten().flatten() {
                let sub_path = sub.path();
                let sub_name = sub.file_name().to_string_lossy().to_ascii_lowercase();
                if sub_path.is_file() && sub_name.ends_with(".mpq") {
                    archives.push((sub_path, locale_archive_priority(&sub_name)));
                }
            }
        }
    }

    if archives.is_empty() {
        return Err(format!("no MPQ archive found in {}", data_dir.display()));
    }
    archives.sort_by_key(|&(_, priority)| priority);
    Ok(archives)
}

/// Opens the archives as a patch chain, in parallel. Falls back to a tolerant
/// sequential open if the parallel path errors, so one bad archive on a custom
/// server doesn't sink the whole client.
fn open_chain(archives: Vec<(PathBuf, i32)>) -> Result<PatchChain, String> {
    let mut chain = PatchChain::new();
    if chain.add_archives_parallel(archives.clone()).is_err() {
        chain = PatchChain::new();
        for (path, priority) in &archives {
            if let Err(e) = chain.add_archive(path, *priority) {
                log::warn!("minimap: skipping archive {}: {e}", path.display());
            }
        }
    }
    if chain.archive_count() == 0 {
        return Err("no MPQ archive could be opened".into());
    }
    Ok(chain)
}

/// A cheap fingerprint of the client's archives (path + size + mtime) so the
/// on-disk index/tile caches invalidate when the data changes.
fn archives_signature(archives: &[(PathBuf, i32)]) -> String {
    let mut hasher = DefaultHasher::new();
    for (path, _) in archives {
        path.to_string_lossy().hash(&mut hasher);
        if let Ok(meta) = std::fs::metadata(path) {
            meta.len().hash(&mut hasher);
            if let Ok(modified) = meta.modified() {
                if let Ok(dur) = modified.duration_since(UNIX_EPOCH) {
                    dur.as_secs().hash(&mut hasher);
                }
            }
        }
    }
    format!("{:016x}", hasher.finish())
}

fn read_cached_index(index_path: &Path, signature: &str) -> Option<Vec<MapInfo>> {
    let bytes = std::fs::read(index_path).ok()?;
    let cached: CachedIndex = serde_json::from_slice(&bytes).ok()?;
    (cached.signature == signature).then_some(cached.maps)
}

fn write_cached_index(index_path: &Path, signature: &str, maps: &[MapInfo]) {
    if let Some(parent) = index_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let cached = CachedIndex { signature: signature.to_string(), maps: maps.to_vec() };
    if let Ok(json) = serde_json::to_vec(&cached) {
        let _ = std::fs::write(index_path, json);
    }
}

/// Removes tile caches from previous signatures (superseded client data).
fn prune_old_caches(base_cache: &Path, signature: &str) {
    let Ok(entries) = std::fs::read_dir(base_cache) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && entry.file_name().to_string_lossy() != signature {
            let _ = std::fs::remove_dir_all(&path);
        }
    }
}

fn base_archive_priority(name: &str) -> Option<i32> {
    const BASE: &[&str] = &["common.mpq", "common-2.mpq", "expansion.mpq", "lichking.mpq"];
    if let Some(i) = BASE.iter().position(|n| *n == name) {
        return Some(i as i32);
    }
    if name == "patch.mpq" {
        return Some(100);
    }
    if let Some(rest) = name.strip_prefix("patch-").and_then(|r| r.strip_suffix(".mpq")) {
        return Some(match rest.parse::<i32>() {
            Ok(n) => 100 + n,
            // Custom letter patches (patch-a.mpq…) override numbered ones.
            Err(_) => 150 + rest.bytes().next().unwrap_or(0) as i32,
        });
    }
    None
}

fn locale_archive_priority(name: &str) -> i32 {
    if name.starts_with("patch-") {
        // patch-enus-2.mpq -> 202, patch-enus.mpq -> 200
        let n = name
            .trim_end_matches(".mpq")
            .rsplit('-')
            .next()
            .and_then(|s| s.parse::<i32>().ok())
            .unwrap_or(0);
        200 + n
    } else {
        50 // locale-enus.mpq, speech-enus.mpq…
    }
}

/// `minimap://localhost/{map}/{z}/{x}/{y}.png` scheme handler.
pub fn handle_request(app: &tauri::AppHandle, request: Request<Vec<u8>>) -> Response<Vec<u8>> {
    let path = request.uri().path().trim_matches('/').to_string();
    let segments: Vec<&str> = path.split('/').collect();

    let parsed = match segments.as_slice() {
        [map, z, x, y] => {
            let tile = (
                z.parse::<u32>(),
                x.parse::<u32>(),
                y.trim_end_matches(".png").parse::<u32>(),
            );
            match tile {
                (Ok(z), Ok(x), Ok(y)) => Some((map.to_string(), z, x, y)),
                _ => None,
            }
        }
        _ => None,
    };
    let Some((map, z, x, y)) = parsed else {
        return status_response(400);
    };
    if !(MIN_ZOOM..=TILE_ZOOM).contains(&z) || x >= (1 << z) || y >= (1 << z) {
        return status_response(400);
    }

    let state = app.state::<MinimapState>();
    let Some(mut inner) = wait_for_data(&state) else {
        return status_response(503); // no client loaded yet
    };
    let data = inner.data.as_mut().unwrap();

    match render_tile(data, &map.to_ascii_lowercase(), z, x, y) {
        Ok(Some(png)) => Response::builder()
            .status(200)
            .header(CONTENT_TYPE, "image/png")
            .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .header(CACHE_CONTROL, "public, max-age=86400")
            .body(png)
            .unwrap_or_else(|_| status_response(500)),
        Ok(None) => status_response(404),
        Err(e) => {
            log::warn!("minimap: tile {map}/{z}/{x}/{y} failed: {e}");
            status_response(500)
        }
    }
}

/// `mpq://localhost/<mpq path>` scheme handler: serves any file from the
/// loaded patch chain as raw bytes. The 3D view (@wowserhq/scene) streams its
/// assets (WDT/ADT terrain, BLP textures, M2 doodads, DBC, sounds) this way,
/// using forward-slash lowercase paths — MPQ lookups are case-insensitive.
pub fn handle_file_request(app: &tauri::AppHandle, request: Request<Vec<u8>>) -> Response<Vec<u8>> {
    let path = request.uri().path().trim_matches('/');
    let decoded = percent_decode(path);
    let mpq_path = decoded.replace('/', "\\");
    if mpq_path.is_empty() || mpq_path.contains("..") {
        return status_response(400);
    }

    let state = app.state::<MinimapState>();
    let Some(mut inner) = wait_for_data(&state) else {
        return status_response(503); // no client loaded yet
    };
    let data = inner.data.as_mut().unwrap();

    match data.read_cached(&mpq_path) {
        Ok(bytes) => Response::builder()
            .status(200)
            .header(CONTENT_TYPE, "application/octet-stream")
            .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .header(CACHE_CONTROL, "public, max-age=86400")
            .body(bytes.as_ref().clone())
            .unwrap_or_else(|_| status_response(500)),
        Err(_) => status_response(404),
    }
}

/// Decodes %XX escapes (asset paths may contain spaces).
fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(byte) = u8::from_str_radix(&input[i + 1..i + 3], 16) {
                out.push(byte);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn status_response(status: u16) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .body(Vec::new())
        .unwrap()
}

/// Returns the tile's PNG bytes, None when no minimap covers this cell.
/// Both outcomes are cached on disk (misses as empty files).
fn render_tile(
    data: &mut MinimapData,
    map_key: &str,
    z: u32,
    x: u32,
    y: u32,
) -> Result<Option<Vec<u8>>, String> {
    let cache_path = data.cache_dir.join(map_key).join(z.to_string()).join(format!("{x}_{y}.png"));
    if let Ok(bytes) = std::fs::read(&cache_path) {
        return Ok(if bytes.is_empty() { None } else { Some(bytes) });
    }

    let png = if z == TILE_ZOOM {
        render_native_tile(data, map_key, x, y)?
    } else {
        render_composed_tile(data, map_key, z, x, y)?
    };

    if let Some(parent) = cache_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(&cache_path, png.as_deref().unwrap_or_default());
    Ok(png)
}

/// Zoom 8: decode the cell's minimap BLP as-is.
fn render_native_tile(
    data: &mut MinimapData,
    map_key: &str,
    x: u32,
    y: u32,
) -> Result<Option<Vec<u8>>, String> {
    let Some(blp_path) = data.maps.get(map_key).and_then(|m| m.tiles.get(&(x, y))) else {
        return Ok(None);
    };
    let blp_bytes = data
        .chain
        .read_file(blp_path)
        .map_err(|e| format!("{blp_path}: {e}"))?;
    let blp = wow_blp::parser::parse_blp(&blp_bytes).map_err(|e| format!("{blp_path}: {e:?}"))?;
    let image = wow_blp::convert::blp_to_image(&blp, 0).map_err(|e| format!("{blp_path}: {e:?}"))?;
    let mut rgba = image.to_rgba8();
    if rgba.width() != TILE_SIZE || rgba.height() != TILE_SIZE {
        rgba = image::imageops::resize(&rgba, TILE_SIZE, TILE_SIZE, FilterType::Triangle);
    }
    Ok(Some(encode_png(&rgba)?))
}

/// Zoom < 8: compose the four children of the next zoom level and downscale.
fn render_composed_tile(
    data: &mut MinimapData,
    map_key: &str,
    z: u32,
    x: u32,
    y: u32,
) -> Result<Option<Vec<u8>>, String> {
    let mut canvas: Option<image::RgbaImage> = None;
    for dy in 0..2u32 {
        for dx in 0..2u32 {
            let Some(child) = render_tile(data, map_key, z + 1, x * 2 + dx, y * 2 + dy)? else {
                continue;
            };
            let child = image::load_from_memory(&child)
                .map_err(|e| format!("cached tile decode: {e}"))?
                .to_rgba8();
            let canvas = canvas
                .get_or_insert_with(|| image::RgbaImage::new(TILE_SIZE * 2, TILE_SIZE * 2));
            image::imageops::overlay(
                canvas,
                &child,
                (dx * TILE_SIZE) as i64,
                (dy * TILE_SIZE) as i64,
            );
        }
    }
    let Some(canvas) = canvas else {
        return Ok(None);
    };
    let resized = image::imageops::resize(&canvas, TILE_SIZE, TILE_SIZE, FilterType::Triangle);
    Ok(Some(encode_png(&resized)?))
}

fn encode_png(image: &image::RgbaImage) -> Result<Vec<u8>, String> {
    let mut buf = Vec::new();
    image
        .write_to(&mut Cursor::new(&mut buf), image::ImageFormat::Png)
        .map_err(|e| format!("png encode: {e}"))?;
    Ok(buf)
}
