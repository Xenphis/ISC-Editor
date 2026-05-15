import { defineStore } from 'pinia';
import { reactive, ref, computed } from 'vue';
import type { ItemTemplate } from './item_template';
import { generateDiffQuery, generateFullQuery } from '@/composables/useQueryGenerator';
import type { SessionQuery } from '@/stores/moduleStore';
import * as itemService from './service';

// ─── Default factory ────────────────────────────────────────────────

function createDefaultItem(): ItemTemplate {
  return {
    entry: 0,
    class: 0,
    subclass: 0,
    SoundOverrideSubclass: -1,
    name: '',
    displayid: 0,
    Quality: 0,
    Flags: 0,
    FlagsExtra: 0,
    BuyCount: 1,
    BuyPrice: 0,
    SellPrice: 0,
    InventoryType: 0,
    AllowableClass: -1,
    AllowableRace: -1,
    ItemLevel: 0,
    RequiredLevel: 0,
    RequiredSkill: 0,
    RequiredSkillRank: 0,
    requiredspell: 0,
    requiredhonorrank: 0,
    RequiredCityRank: 0,
    RequiredReputationFaction: 0,
    RequiredReputationRank: 0,
    maxcount: 0,
    stackable: 1,
    ContainerSlots: 0,
    StatsCount: 0,
    stat_type1: 0,
    stat_value1: 0,
    stat_type2: 0,
    stat_value2: 0,
    stat_type3: 0,
    stat_value3: 0,
    stat_type4: 0,
    stat_value4: 0,
    stat_type5: 0,
    stat_value5: 0,
    stat_type6: 0,
    stat_value6: 0,
    stat_type7: 0,
    stat_value7: 0,
    stat_type8: 0,
    stat_value8: 0,
    stat_type9: 0,
    stat_value9: 0,
    stat_type10: 0,
    stat_value10: 0,
    ScalingStatDistribution: 0,
    ScalingStatValue: 0,
    dmg_min1: 0,
    dmg_max1: 0,
    dmg_type1: 0,
    dmg_min2: 0,
    dmg_max2: 0,
    dmg_type2: 0,
    armor: 0,
    holy_res: 0,
    fire_res: 0,
    nature_res: 0,
    frost_res: 0,
    shadow_res: 0,
    arcane_res: 0,
    delay: 1000,
    ammo_type: 0,
    RangedModRange: 0,
    spellid_1: 0,
    spelltrigger_1: 0,
    spellcharges_1: 0,
    spellppmRate_1: 0,
    spellcooldown_1: -1,
    spellcategory_1: 0,
    spellcategorycooldown_1: -1,
    spellid_2: 0,
    spelltrigger_2: 0,
    spellcharges_2: 0,
    spellppmRate_2: 0,
    spellcooldown_2: -1,
    spellcategory_2: 0,
    spellcategorycooldown_2: -1,
    spellid_3: 0,
    spelltrigger_3: 0,
    spellcharges_3: 0,
    spellppmRate_3: 0,
    spellcooldown_3: -1,
    spellcategory_3: 0,
    spellcategorycooldown_3: -1,
    spellid_4: 0,
    spelltrigger_4: 0,
    spellcharges_4: 0,
    spellppmRate_4: 0,
    spellcooldown_4: -1,
    spellcategory_4: 0,
    spellcategorycooldown_4: -1,
    spellid_5: 0,
    spelltrigger_5: 0,
    spellcharges_5: 0,
    spellppmRate_5: 0,
    spellcooldown_5: -1,
    spellcategory_5: 0,
    spellcategorycooldown_5: -1,
    bonding: 0,
    description: '',
    PageText: 0,
    LanguageID: 0,
    PageMaterial: 0,
    startquest: 0,
    lockid: 0,
    Material: -1,
    sheath: 0,
    RandomProperty: 0,
    RandomSuffix: 0,
    block: 0,
    itemset: 0,
    MaxDurability: 0,
    area: 0,
    Map: 0,
    BagFamily: 0,
    TotemCategory: 0,
    socketColor_1: 0,
    socketContent_1: 0,
    socketColor_2: 0,
    socketContent_2: 0,
    socketColor_3: 0,
    socketContent_3: 0,
    socketBonus: 0,
    GemProperties: 0,
    RequiredDisenchantSkill: -1,
    ArmorDamageModifier: 0,
    Duration: 0,
    ItemLimitCategory: 0,
    HolidayId: 0,
    ScriptName: '',
    DisenchantID: 0,
    FoodType: 0,
    minMoneyLoot: 0,
    maxMoneyLoot: 0,
    flagsCustom: 0,
    VerifiedBuild: null,
  };
}

// ─── EditorCache ────────────────────────────────────────────────────

interface EditorCache {
  formData: ItemTemplate;
  originalValue: ItemTemplate;
}

// ─── Store ──────────────────────────────────────────────────────────

export const useItemModuleStore = defineStore('itemModule', () => {
  // --- List state ---
  const items = ref<ItemTemplate[]>([]);
  const loading = ref(false);
  const currentSearch = ref('');
  const listLoaded = ref(false);

  // --- Editor state ---
  const editing = ref(false);
  const editingEntry = ref<number | null>(null);
  const formData = reactive<ItemTemplate>(createDefaultItem());
  const originalValue = ref<ItemTemplate | null>(null);
  const editorDataLoaded = ref(false);

  // --- Cache for multi-entry editing ---
  const dirtyCache = new Map<number, EditorCache>();

  // ─── Actions ────────────────────────────────────────────────────

  async function fetchItems(search?: string, limit?: number, offset?: number) {
    loading.value = true;
    try {
      const result = await itemService.getItems(search, limit, offset);
      items.value = result.data;
      currentSearch.value = search || '';
      listLoaded.value = true;
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function openEditor(entry: number | 'new') {
    editing.value = true;
    editorDataLoaded.value = false;

    if (entry === 'new') {
      editingEntry.value = null;
      Object.assign(formData, createDefaultItem());
      originalValue.value = null;
      editorDataLoaded.value = true;
      return;
    }

    editingEntry.value = entry;

    // Check cache first
    if (dirtyCache.has(entry)) {
      const cached = dirtyCache.get(entry)!;
      Object.assign(formData, cached.formData);
      originalValue.value = cached.originalValue;
      editorDataLoaded.value = true;
      return;
    }

    // Load from backend
    try {
      const item = await itemService.getItem(entry);
      Object.assign(formData, item);
      originalValue.value = structuredClone(item);
      editorDataLoaded.value = true;
    } catch (error) {
      console.error('Failed to load item:', error);
      throw error;
    }
  }

  function closeEditor() {
    editing.value = false;
    editingEntry.value = null;
    editorDataLoaded.value = false;
    Object.assign(formData, createDefaultItem());
    originalValue.value = null;
  }

  function saveToCache() {
    if (editingEntry.value == null) return;
    
    dirtyCache.set(editingEntry.value, {
      formData: structuredClone(formData),
      originalValue: originalValue.value ? structuredClone(originalValue.value) : createDefaultItem(),
    });
  }

  function restoreFromCache(entry: number) {
    const cached = dirtyCache.get(entry);
    if (!cached) return;

    Object.assign(formData, cached.formData);
    originalValue.value = cached.originalValue;
  }

  function discardCache(entry: number) {
    dirtyCache.delete(entry);
  }

  function clearAllCaches() {
    dirtyCache.clear();
  }

  async function saveItem() {
    try {
      await itemService.saveItem(formData);
      
      // Clear cache for this entry
      if (editingEntry.value != null) {
        dirtyCache.delete(editingEntry.value);
      }
      
      // Refresh list if loaded
      if (listLoaded.value) {
        await fetchItems(currentSearch.value);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save item:', error);
      throw error;
    }
  }

  async function deleteItem(entry: number) {
    try {
      await itemService.deleteItem(entry);
      dirtyCache.delete(entry);
      
      // Refresh list if loaded
      if (listLoaded.value) {
        await fetchItems(currentSearch.value);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }

  // ─── SQL Generation (for session tracking) ─────────────────────

  function getAllDiffQueries(): SessionQuery[] {
    const queries: SessionQuery[] = [];

    if (!originalValue.value || !editingEntry.value) {
      return queries;
    }

    // Main table diff
    const mainDiff = generateDiffQuery(
      'item_template',
      'entry',
      originalValue.value as Record<string, unknown>,
      formData as unknown as Record<string, unknown>
    );

    if (mainDiff) {
      queries.push({
        query: mainDiff,
        table: 'item_template',
        entry: editingEntry.value,
      });
    }

    return queries;
  }

  const combinedDiffQuery = computed(() => {
    const queries = getAllDiffQueries();
    return queries.map((q) => q.query).join('\n\n');
  });

  const combinedHasChanges = computed(() => {
    return getAllDiffQueries().length > 0;
  });

  const combinedChangedFields = computed(() => {
    if (!originalValue.value) return [];
    
    const changed: { field: string; oldValue: unknown; newValue: unknown }[] = [];
    const keys = Object.keys(formData) as (keyof ItemTemplate)[];
    
    for (const key of keys) {
      if (formData[key] !== originalValue.value[key]) {
        changed.push({
          field: key,
          oldValue: originalValue.value[key],
          newValue: formData[key],
        });
      }
    }
    
    return changed;
  });

  const combinedFullQuery = computed(() => {
    if (!editingEntry.value && !formData.entry) {
      return '';
    }

    return generateFullQuery('item_template', 'entry', formData);
  });

  return {
    // State
    items,
    loading,
    currentSearch,
    listLoaded,
    editing,
    editingEntry,
    formData,
    originalValue,
    editorDataLoaded,
    dirtyCache,

    // Actions
    fetchItems,
    openEditor,
    closeEditor,
    saveToCache,
    restoreFromCache,
    discardCache,
    clearAllCaches,
    saveItem,
    deleteItem,

    // SQL Generation
    getAllDiffQueries,
    combinedDiffQuery,
    combinedHasChanges,
    combinedChangedFields,
    combinedFullQuery,
  };
});
