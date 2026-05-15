<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Column from 'primevue/column';
import ModuleLayout from '@/components/ModuleLayout.vue';
import StyledDataTable from '@/components/StyledDataTable.vue';
import ActionsColumn from '@/components/ActionsColumn.vue';
import type { ItemTemplate } from '@/modules/item/item_template';
import { useItemModuleStore } from '@/modules/item/store';
import { item_quality_options, item_class_options } from '@/modules/item/types/defines';

const { t } = useI18n();
const router = useRouter();
const store = useItemModuleStore();

const qualityColors: Record<number, string> = {
  0: '#9d9d9d',
  1: '#ffffff',
  2: '#1eff00',
  3: '#0070dd',
  4: '#a335ee',
  5: '#ff8000',
  6: '#e6cc80',
  7: '#e6cc80',
};

function getQualityLabel(quality: number): string {
  const option = item_quality_options.find((q) => q.value === quality);
  return option?.name || `Quality ${quality}`;
}

function getQualityColor(quality: number): string {
  return qualityColors[quality] || '#9d9d9d';
}

function getClassLabel(classId: number): string {
  const option = item_class_options.find((c) => c.value === classId);
  return option?.name || `Class ${classId}`;
}

async function loadItems() {
  await store.fetchItems(store.currentSearch || undefined, 50);
}

async function onSearch(query: string) {
  store.currentSearch = query;
  await loadItems();
}

function onEdit(item: ItemTemplate) {
  router.push(`/item/${item.entry}`);
}

async function onDelete(item: ItemTemplate) {
  try {
    await store.deleteItem(item.entry);
    await loadItems();
  } catch (e) {
    console.error('Failed to delete item:', e);
  }
}

function onAdd() {
  router.push('/item/new');
}

onMounted(() => {
  if (!store.listLoaded) {
    loadItems();
  }
});
</script>

<template>
  <ModuleLayout
    :title="t('item.title')"
    :description="t('modules.item.description')"
    :searchPlaceholder="t('item.searchPlaceholder')"
    :addButtonLabel="t('item.addNew')"
    @add="onAdd"
    @update:search="onSearch"
  >
    <StyledDataTable
      :data="store.items"
      :loading="store.loading"
      dataKey="entry"
      @edit="onEdit"
      @delete="onDelete"
    >
      <Column
        field="entry"
        :header="t('item.columns.entry')"
        style="width: 8rem"
      />

      <Column
        field="name"
        :header="t('item.columns.name')"
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          <div class="item-name">{{ data.name }}</div>
        </template>
      </Column>

      <Column
        :header="t('item.columns.Quality')"
        style="width: 10rem"
      >
        <template #body="{ data }">
          <span :style="{ color: getQualityColor(data.Quality), fontWeight: 500 }">
            {{ getQualityLabel(data.Quality) }}
          </span>
        </template>
      </Column>

      <Column
        :header="t('item.columns.class')"
        style="width: 12rem"
      >
        <template #body="{ data }">
          {{ getClassLabel(data.class) }}
        </template>
      </Column>

      <Column
        field="ItemLevel"
        :header="t('item.columns.ItemLevel')"
        style="width: 8rem"
      />

      <Column style="width: 8rem">
        <template #body="{ data }">
          <ActionsColumn :data="data" @edit="onEdit" @delete="onDelete" />
        </template>
      </Column>
    </StyledDataTable>
  </ModuleLayout>
</template>

<style scoped>
.item-name {
  font-weight: 500;
}
</style>
