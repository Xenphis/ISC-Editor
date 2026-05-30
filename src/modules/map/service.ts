import { invoke } from '@/utils/invoke'
import type { AccessRequirement } from './types/access_requirement'

export interface AccessRequirementListResult {
  data: AccessRequirement[]
  total: number
}

export async function getAccessRequirements(
  search?: string,
  limit?: number,
  offset?: number,
): Promise<AccessRequirementListResult> {
  return invoke('get_access_requirements', { search, limit, offset })
}

export async function getAccessRequirement(mapId: number, difficulty: number): Promise<AccessRequirement> {
  return invoke('get_access_requirement', { mapId, difficulty })
}

export async function saveAccessRequirement(data: AccessRequirement): Promise<void> {
  return invoke('save_access_requirement', { data })
}

export async function deleteAccessRequirement(mapId: number, difficulty: number): Promise<void> {
  return invoke('delete_access_requirement', { mapId, difficulty })
}
