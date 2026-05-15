<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Column from 'primevue/column'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { Creature } from '@/modules/npc/types/creature/creature'

const { t } = useI18n()

defineProps<{
  spawns: Creature[]
}>()

const emit = defineEmits<{
  (e: 'edit', spawn: Creature): void
  (e: 'delete', spawn: Creature): void
}>()
</script>

<template>
  <div class="field-group">
    <div class="field-group-header">
      <h4>{{ t('creature_template.groups.spawns') }}</h4>
      <p>{{ t('creature_template.groups.spawnsDesc') }}</p>
    </div>
    <StyledDataTable
      :data="spawns"
      dataKey="guid"
    >
      <Column field="guid" :header="t('creature_template.spawnColumns.guid')" style="width: 6rem" />
      <Column field="map" :header="t('creature_template.spawnColumns.map')" style="width: 5rem" />
      <Column field="zoneId" :header="t('creature_template.spawnColumns.zone')" style="width: 5rem" />
      <Column :header="t('creature_template.spawnColumns.position')" style="min-width: 16rem">
        <template #body="{ data: spawn }">
          <span class="spawn-coords">{{ spawn.position_x.toFixed(2) }}, {{ spawn.position_y.toFixed(2) }}, {{ spawn.position_z.toFixed(2) }}</span>
        </template>
      </Column>
      <Column field="spawnMask" :header="t('creature_template.spawnColumns.spawnMask')" style="width: 8rem" />
      <Column field="spawntimesecs" :header="t('creature_template.spawnColumns.respawn')" style="width: 8rem" />
      <Column :header="t('creature_template.spawnColumns.actions')" style="width: 8rem" headerStyle="text-align: right" bodyStyle="text-align: right">
        <template #body="{ data: spawn }">
          <ActionsColumn :data="spawn" @edit="emit('edit', spawn)" @delete="emit('delete', spawn)" />
        </template>
      </Column>
    </StyledDataTable>
  </div>
</template>

<style scoped>
.spawn-coords {
  font-family: monospace;
  font-size: 0.8rem;
  color: #94a3b8;
}
</style>
