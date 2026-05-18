<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Column from 'primevue/column'
import ModuleLayout from '@/components/ModuleLayout.vue'
import StyledDataTable from '@/components/StyledDataTable.vue'
import ActionsColumn from '@/components/ActionsColumn.vue'
import type { CreatureClassLevelStats } from '@/modules/npc/types/creature_classlevelstats'
import { useCreatureClassLevelStatsStore } from '@/modules/npc/stores/creatureClassLevelStatsStore'

const { t } = useI18n()
const router = useRouter()
const store = useCreatureClassLevelStatsStore()

const classMap: Record<number, { label: string; color: string }> = {
  1: { label: 'Warrior', color: '#60a5fa' },
  2: { label: 'Paladin', color: '#fbbf24' },
  4: { label: 'Rogue', color: '#fb923c' },
  8: { label: 'Mage', color: '#c084fc' },
}

function getClassLabel(classId: number): string {
  return classMap[classId]?.label ?? `Class ${classId}`
}

function getClassColor(classId: number): string {
  return classMap[classId]?.color ?? '#cbd5e1'
}

const searchQuery = ref('')

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim()
  let rows = store.entries
  if (q) {
    const n = Number(q)
    if (!isNaN(n)) {
      rows = rows.filter(r => r.level === n)
    } else {
      const lower = q.toLowerCase()
      rows = rows.filter(r => getClassLabel(r.class).toLowerCase().includes(lower))
    }
  }
  return rows.map(r => ({ ...r, _key: `${r.level}_${r.class}` }))
})

function onSearch(query: string) {
  searchQuery.value = query
}

function onEdit(row: CreatureClassLevelStats) {
  router.push(`/npc/creature-classlevelstats/${row.level}/${row.class}`)
}

onMounted(() => {
  if (!store.listLoaded) {
    store.fetchEntries()
  }
})
</script>

<template>
  <ModuleLayout
    :title="t('creature_classlevelstats.title')"
    :description="t('creature_classlevelstats.description')"
    :searchPlaceholder="t('creature_classlevelstats.searchPlaceholder')"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="filteredEntries"
      dataKey="_key"
      :rows="80"
    >
      <Column
        field="level"
        :header="t('creature_classlevelstats.fields.level')"
        style="width: 8rem"
        sortable
      />

      <Column
        :header="t('creature_classlevelstats.fields.class')"
        style="width: 10rem"
        sortable
        sortField="class"
      >
        <template #body="{ data }">
          <span :style="{ color: getClassColor(data.class), fontWeight: 500 }">
            {{ getClassLabel(data.class) }}
          </span>
        </template>
      </Column>

      <Column
        :header="t('creature_classlevelstats.fields.basehp0')"
        style="width: 10rem"
        sortable
        sortField="basehp0"
      >
        <template #body="{ data }">
          <span class="stat-value">{{ data.basehp0.toLocaleString() }}</span>
        </template>
      </Column>

      <Column
        :header="t('creature_classlevelstats.fields.damage_base')"
        style="width: 10rem"
        sortable
        sortField="damage_base"
      >
        <template #body="{ data }">
          <span class="stat-value">{{ data.damage_base.toFixed(2) }}</span>
        </template>
      </Column>

      <Column
        :header="t('npc.columns.actions')"
        style="width: 8rem"
        headerStyle="text-align: right"
        bodyStyle="text-align: right"
      >
        <template #body="{ data }">
          <ActionsColumn :data="data" :showDelete="false" @edit="onEdit" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.stat-value {
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
}
</style>
