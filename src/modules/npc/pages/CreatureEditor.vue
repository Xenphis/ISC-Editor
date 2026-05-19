<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import EditorHeader from '@/components/EditorHeader.vue'
import type { Creature } from '@/modules/npc/types/creature/creature'
import {
  movement_type_options,
  spawn_mask_options,
  equipment_id_options,
  stand_state_types as stand_state_options,
  anim_tier_types as anim_tier_options,
  vis_flags_options,
  sheath_state_types as sheath_state_options,
  pvp_flags_options,
  npc_flags,
  unit_flags_options,
  dynamicflags_options,
  visibility_distance_options as visibility_distance_type_options,
  ground_movement_options as ground_options,
  swim_movement_options as swim_options,
  flight_movement_options as flight_options,
  rooted_options,
  chase_movement_options as chase_options,
  random_movement_options as random_options,
} from '@/modules/npc/types/defines'
import type { CreatureAddon } from '@/modules/npc/types/creature/creature_addon'
import type { CreatureMovementOverride } from '@/modules/npc/types/creature/creature_movement_override'
import { getCreatureSpawns, getCreatureAddon, getCreatureMovementOverride } from '@/modules/npc/service'
import { useQueryGenerator } from '@/composables/useQueryGenerator'
import SqlQueryPanel from '@/components/SqlQueryPanel.vue'
import BitmaskField from '@/components/BitmaskField.vue'
import EditorField from '@/components/EditorField.vue'

const { t } = useI18n()

const props = defineProps<{
  spawnGuid: number
  npcEntry: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Creature): void
}>()

const loading = ref(false)

const form = reactive<Creature>({
  guid: 0,
  id: 0,
  map: 0,
  zoneId: 0,
  areaId: 0,
  spawnMask: 1,
  phaseMask: 1,
  modelid: 0,
  equipment_id: 0,
  position_x: 0,
  position_y: 0,
  position_z: 0,
  orientation: 0,
  spawntimesecs: 300,
  wander_distance: 0,
  currentwaypoint: 0,
  curhealth: 1,
  curmana: 0,
  MovementType: 0,
  npcflag: 0,
  unit_flags: 0,
  dynamicflags: 0,
  ScriptName: '',
  StringId: null,
  VerifiedBuild: null,
})

const originalValue = ref<Creature | null>(null)

// --- Creature Addon ---
const addonForm = reactive<CreatureAddon>({
  guid: 0,
  path_id: 0,
  mount: 0,
  MountCreatureID: 0,
  StandState: 0,
  AnimTier: 0,
  VisFlags: 0,
  SheathState: 0,
  PvPFlags: 0,
  emote: 0,
  visibilityDistanceType: 0,
  auras: null,
})

const originalAddon = ref<CreatureAddon | null>(null)

const standStateOptions = stand_state_options.map(o => ({ value: o.value, label: o.name }))
const animTierOptions = anim_tier_options.map(o => ({ value: o.value, label: o.name }))
const sheathStateOptions = sheath_state_options.map(o => ({ value: o.value, label: o.name }))
const visDistanceOptions = visibility_distance_type_options.map(o => ({ value: o.value, label: o.name }))

const {
  diffQuery: addonDiffQuery,
  hasChanges: addonHasChanges,
  changedFields: addonChangedFields,
} = useQueryGenerator<CreatureAddon>(
  'creature_addon',
  'guid',
  originalAddon,
  addonForm,
)

const addonModifiedFieldSet = computed(() => new Set(addonChangedFields.value.map(c => c.field)))

function isAddonFieldModified(field: string): boolean {
  return addonModifiedFieldSet.value.has(field)
}

// --- Creature Movement Override ---
const movementOverrideForm = reactive<CreatureMovementOverride>({
  SpawnId: 0,
  Ground: undefined,
  Swim: undefined,
  Flight: undefined,
  Rooted: undefined,
  Chase: undefined,
  Random: undefined,
  InteractionPauseTimer: undefined,
})

const originalMovementOverride = ref<CreatureMovementOverride | null>(null)

const movrGroundOptions = ground_options.map(o => ({ value: o.value, label: o.name }))
const movrSwimOptions = swim_options.map(o => ({ value: o.value, label: o.name }))
const movrFlightOptions = flight_options.map(o => ({ value: o.value, label: o.name }))
const movrRootedOptions = rooted_options.map(o => ({ value: o.value, label: o.name }))
const movrChaseOptions = chase_options.map(o => ({ value: o.value, label: o.name }))
const movrRandomOptions = random_options.map(o => ({ value: o.value, label: o.name }))

const {
  diffQuery: movementOverrideDiffQuery,
  hasChanges: movementOverrideHasChanges,
  changedFields: movementOverrideChangedFields,
} = useQueryGenerator<CreatureMovementOverride>(
  'creature_movement_override',
  'SpawnId',
  originalMovementOverride,
  movementOverrideForm,
)

const movementOverrideModifiedFieldSet = computed(() => new Set(movementOverrideChangedFields.value.map(c => c.field)))

function isMovementOverrideFieldModified(field: string): boolean {
  return movementOverrideModifiedFieldSet.value.has(field)
}

const movementTypeOptions = movement_type_options.map(o => ({ value: o.value, label: o.name }))
const equipmentOptions = equipment_id_options.map(o => ({ value: o.value, label: o.name }))

const { diffQuery, fullQuery, hasChanges, changedFields } = useQueryGenerator<Creature>(
  'creature',
  'guid',
  originalValue,
  form,
)

const combinedDiffQuery = computed(() => {
  const parts: string[] = []
  if (diffQuery.value) parts.push(diffQuery.value)
  if (addonDiffQuery.value) parts.push(addonDiffQuery.value)
  if (movementOverrideDiffQuery.value) parts.push(movementOverrideDiffQuery.value)
  return parts.join('\n')
})

const combinedHasChanges = computed(() =>
  hasChanges.value || addonHasChanges.value || movementOverrideHasChanges.value
)

const combinedChangedFields = computed(() => [
  ...changedFields.value,
  ...addonChangedFields.value,
  ...movementOverrideChangedFields.value,
])

const modifiedFieldSet = computed(() => new Set(changedFields.value.map(c => c.field)))

function isFieldModified(field: string): boolean {
  return modifiedFieldSet.value.has(field)
}

function onDiscard() {
  if (originalValue.value) Object.assign(form, originalValue.value)
  if (originalAddon.value) Object.assign(addonForm, originalAddon.value)
  if (originalMovementOverride.value) Object.assign(movementOverrideForm, originalMovementOverride.value)
}

function onSave() {
  emit('save', { ...form })
}

onMounted(async () => {
  loading.value = true
  try {
    const spawns = await getCreatureSpawns(props.npcEntry)
    const spawn = spawns.find(s => s.guid === props.spawnGuid)
    if (spawn) {
      Object.assign(form, spawn)
      originalValue.value = { ...spawn }
    }
  } catch (e) {
    console.error('Failed to load spawn:', e)
  } finally {
    loading.value = false
  }

  try {
    const addon = await getCreatureAddon(props.spawnGuid)
    if (addon) {
      Object.assign(addonForm, addon)
      originalAddon.value = { ...addon }
    } else {
      addonForm.guid = props.spawnGuid
      originalAddon.value = { ...addonForm }
    }
  } catch (e) {
    console.error('Failed to load creature addon:', e)
  }

  try {
    const movOverride = await getCreatureMovementOverride(props.spawnGuid)
    if (movOverride) {
      Object.assign(movementOverrideForm, movOverride)
      originalMovementOverride.value = { ...movOverride }
    } else {
      movementOverrideForm.SpawnId = props.spawnGuid
      originalMovementOverride.value = { ...movementOverrideForm }
    }
  } catch (e) {
    console.error('Failed to load creature movement override:', e)
  }
})
</script>

<template>
  <div class="spawn-editor">
    <!-- Header -->
    <EditorHeader
      :title="t('creature.editorTitle')"
      :id="form.guid"
      :backLabel="t('creature.back')"
      :hasChanges="combinedHasChanges"
      :discardLabel="t('creature.discard')"
      :executeLabel="t('creature.save')"
      @back="emit('close')"
      @discard="onDiscard"
      @execute="onSave"
    />

    <!-- SQL Query Panel -->
    <SqlQueryPanel
      :diffQuery="combinedDiffQuery"
      :fullQuery="fullQuery"
      :hasChanges="combinedHasChanges"
      :changedFields="combinedChangedFields"
    />

    <!-- Tabs -->
    <Tabs value="general">
      <TabList>
        <Tab value="general">{{ t('creature.tabs.general') }}</Tab>
        <Tab value="movement">{{ t('creature.tabs.position') }}</Tab>
        <Tab value="behavior">{{ t('creature.tabs.advanced') }}</Tab>
        <Tab value="addon">{{ t('creature.tabs.addon') }}</Tab>
      </TabList>

      <TabPanels>
        <!-- ==================== GENERAL ==================== -->
        <TabPanel value="general">
          <!-- Identification -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.identification') }}</h4>
              <p>{{ t('creature.groups.identificationDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.guid')" :tooltip="t('creature.tooltips.guid')" :modified="isFieldModified('guid')">
                <InputNumber v-model="form.guid" :useGrouping="false" fluid disabled />
              </EditorField>
              <EditorField :label="t('creature.fields.id')" :tooltip="t('creature.tooltips.id')" :modified="isFieldModified('id')">
                <InputNumber v-model="form.id" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.modelid')" :tooltip="t('creature.tooltips.modelid')" :modified="isFieldModified('modelid')">
                <InputNumber v-model="form.modelid" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Position -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.position') }}</h4>
              <p>{{ t('creature.groups.positionDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.map')" :tooltip="t('creature.tooltips.map')" :modified="isFieldModified('map')">
                <InputNumber v-model="form.map" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.zoneId')" :tooltip="t('creature.tooltips.zoneId')" :modified="isFieldModified('zoneId')">
                <InputNumber v-model="form.zoneId" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.areaId')" :tooltip="t('creature.tooltips.areaId')" :modified="isFieldModified('areaId')">
                <InputNumber v-model="form.areaId" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.position_x')" :tooltip="t('creature.tooltips.position_x')" :modified="isFieldModified('position_x')">
                <InputNumber v-model="form.position_x" :minFractionDigits="1" :maxFractionDigits="6" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.position_y')" :tooltip="t('creature.tooltips.position_y')" :modified="isFieldModified('position_y')">
                <InputNumber v-model="form.position_y" :minFractionDigits="1" :maxFractionDigits="6" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.position_z')" :tooltip="t('creature.tooltips.position_z')" :modified="isFieldModified('position_z')">
                <InputNumber v-model="form.position_z" :minFractionDigits="1" :maxFractionDigits="6" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.orientation')" :tooltip="t('creature.tooltips.orientation')" :modified="isFieldModified('orientation')">
                <InputNumber v-model="form.orientation" :minFractionDigits="1" :maxFractionDigits="6" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Spawn Settings -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.spawnSettings') }}</h4>
              <p>{{ t('creature.groups.spawnSettingsDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.spawnMask')" :tooltip="t('creature.tooltips.spawnMask')" :modified="isFieldModified('spawnMask')">
                <BitmaskField v-model="form.spawnMask" :options="spawn_mask_options" :label="t('creature.fields.spawnMask')" />
              </EditorField>
              <EditorField :label="t('creature.fields.phaseMask')" :tooltip="t('creature.tooltips.phaseMask')" :modified="isFieldModified('phaseMask')">
                <InputNumber v-model="form.phaseMask" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.spawntimesecs')" :tooltip="t('creature.tooltips.spawntimesecs')" :modified="isFieldModified('spawntimesecs')">
                <InputNumber v-model="form.spawntimesecs" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_visdistance')" :modified="isAddonFieldModified('visibilityDistanceType')">
                <Select v-model="addonForm.visibilityDistanceType" :options="visDistanceOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Current State -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.currentState') }}</h4>
              <p>{{ t('creature.groups.currentStateDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.curhealth')" :tooltip="t('creature.tooltips.curhealth')" :modified="isFieldModified('curhealth')">
                <InputNumber v-model="form.curhealth" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.curmana')" :tooltip="t('creature.tooltips.curmana')" :modified="isFieldModified('curmana')">
                <InputNumber v-model="form.curmana" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== MOVEMENT ==================== -->
        <TabPanel value="movement">
          <!-- Movement -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.movement') }}</h4>
              <p>{{ t('creature.groups.movementDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.MovementType')" :tooltip="t('creature.tooltips.MovementType')" :modified="isFieldModified('MovementType')">
                <Select v-model="form.MovementType" :options="movementTypeOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.wander_distance')" :tooltip="t('creature.tooltips.wander_distance')" :modified="isFieldModified('wander_distance')">
                <InputNumber v-model="form.wander_distance" :minFractionDigits="1" :maxFractionDigits="5" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.currentwaypoint')" :tooltip="t('creature.tooltips.currentwaypoint')" :modified="isFieldModified('currentwaypoint')">
                <InputNumber v-model="form.currentwaypoint" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_path_id')" :modified="isAddonFieldModified('path_id')">
                <InputNumber v-model="addonForm.path_id" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Movement Override -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.movementOverride') }}</h4>
              <p>{{ t('creature.groups.movementOverrideDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.movr_ground')" :modified="isMovementOverrideFieldModified('Ground')">
                <Select v-model="movementOverrideForm.Ground" :options="movrGroundOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_swim')" :modified="isMovementOverrideFieldModified('Swim')">
                <Select v-model="movementOverrideForm.Swim" :options="movrSwimOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_flight')" :modified="isMovementOverrideFieldModified('Flight')">
                <Select v-model="movementOverrideForm.Flight" :options="movrFlightOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_rooted')" :modified="isMovementOverrideFieldModified('Rooted')">
                <Select v-model="movementOverrideForm.Rooted" :options="movrRootedOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_chase')" :modified="isMovementOverrideFieldModified('Chase')">
                <Select v-model="movementOverrideForm.Chase" :options="movrChaseOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_random')" :modified="isMovementOverrideFieldModified('Random')">
                <Select v-model="movementOverrideForm.Random" :options="movrRandomOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.movr_interaction_pause')" :modified="isMovementOverrideFieldModified('InteractionPauseTimer')">
                <InputNumber v-model="movementOverrideForm.InteractionPauseTimer" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== BEHAVIOR ==================== -->
        <TabPanel value="behavior">
          <!-- Animation -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.animation') }}</h4>
              <p>{{ t('creature.groups.animationDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.addon_standstate')" :modified="isAddonFieldModified('StandState')">
                <Select v-model="addonForm.StandState" :options="standStateOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_animtier')" :modified="isAddonFieldModified('AnimTier')">
                <Select v-model="addonForm.AnimTier" :options="animTierOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_sheathstate')" :modified="isAddonFieldModified('SheathState')">
                <Select v-model="addonForm.SheathState" :options="sheathStateOptions" optionLabel="label" optionValue="value" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_emote')" :modified="isAddonFieldModified('emote')">
                <InputNumber v-model="addonForm.emote" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Flags -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.flags') }}</h4>
              <p>{{ t('creature.groups.flagsDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.npcflag')" :tooltip="t('creature.tooltips.npcflag')" :modified="isFieldModified('npcflag')">
                <BitmaskField v-model="form.npcflag" :options="npc_flags" :label="t('creature.fields.npcflag')" />
              </EditorField>
              <EditorField :label="t('creature.fields.unit_flags')" :tooltip="t('creature.tooltips.unit_flags')" :modified="isFieldModified('unit_flags')">
                <BitmaskField v-model="form.unit_flags" :options="unit_flags_options" :label="t('creature.fields.unit_flags')" />
              </EditorField>
              <EditorField :label="t('creature.fields.dynamicflags')" :tooltip="t('creature.tooltips.dynamicflags')" :modified="isFieldModified('dynamicflags')">
                <BitmaskField v-model="form.dynamicflags" :options="dynamicflags_options" :label="t('creature.fields.dynamicflags')" />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_visflags')" :modified="isAddonFieldModified('VisFlags')">
                <BitmaskField v-model="addonForm.VisFlags" :options="vis_flags_options" :label="t('creature.fields.addon_visflags')" />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_pvpflags')" :modified="isAddonFieldModified('PvPFlags')">
                <BitmaskField v-model="addonForm.PvPFlags" :options="pvp_flags_options" :label="t('creature.fields.addon_pvpflags')" />
              </EditorField>
            </div>
          </div>

          <!-- Script -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.script') }}</h4>
              <p>{{ t('creature.groups.scriptDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.ScriptName')" :tooltip="t('creature.tooltips.ScriptName')" :modified="isFieldModified('ScriptName')">
                <InputText v-model="form.ScriptName" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.StringId')" :tooltip="t('creature.tooltips.StringId')" :modified="isFieldModified('StringId')">
                <InputText v-model="form.StringId" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.VerifiedBuild')" :tooltip="t('creature.tooltips.VerifiedBuild')" :modified="isFieldModified('VerifiedBuild')">
                <InputNumber v-model="form.VerifiedBuild" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>

        <!-- ==================== ADDON ==================== -->
        <TabPanel value="addon">
          <!-- Creature Addon -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.creatureAddon') }}</h4>
              <p>{{ t('creature.groups.creatureAddonDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.addon_mount')" :modified="isAddonFieldModified('mount')">
                <InputNumber v-model="addonForm.mount" :useGrouping="false" fluid />
              </EditorField>
              <EditorField :label="t('creature.fields.addon_mountcreatureid')" :modified="isAddonFieldModified('MountCreatureID')">
                <InputNumber v-model="addonForm.MountCreatureID" :useGrouping="false" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Auras -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('creature.groups.aura') }}</h4>
              <p>{{ t('creature.groups.auraDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('creature.fields.addon_auras')" :modified="isAddonFieldModified('auras')" fullWidth>
                <InputText v-model="addonForm.auras" fluid />
              </EditorField>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.spawn-editor {
  max-width: 80rem;
}

.field-group {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.field-group-header {
  margin-bottom: 1rem;
}

.field-group-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.25rem 0;
}

.field-group-header p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

</style>
