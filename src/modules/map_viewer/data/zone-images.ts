const IMAGE_PREFIX = 'wow_classic_high_resolution_world_terrain_map_'

// Non-eager `?url` glob: each PNG stays a separate hashed asset and is only
// fetched when its zone is displayed (the full set is ~116 MB).
const modules = import.meta.glob<string>(
  '/src/assets/maps/wow_classic_high_resolution_world_terrain_map_*.png',
  { query: '?url', import: 'default' },
)

function slugFromPath(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  return file.slice(IMAGE_PREFIX.length, -'.png'.length)
}

const loadersBySlug = new Map<string, () => Promise<string>>(
  Object.entries(modules).map(([path, loader]) => [slugFromPath(path), loader]),
)

/** Zone slugs derived from the actual asset filenames (never drifts from src/assets/maps). */
export const ZONE_IMAGE_SLUGS: string[] = [...loadersBySlug.keys()].sort()

export function hasZoneImage(slug: string): boolean {
  return loadersBySlug.has(slug)
}

export async function loadZoneImageUrl(slug: string): Promise<string> {
  const loader = loadersBySlug.get(slug)
  if (!loader) {
    throw new Error(`No map image for zone slug "${slug}"`)
  }
  return loader()
}
