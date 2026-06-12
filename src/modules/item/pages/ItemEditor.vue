<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Button from 'primevue/button';
import SqlQueryPanel from '@/components/SqlQueryPanel.vue';
import EditorField from '@/components/EditorField.vue';
import BitmaskField from '@/components/BitmaskField.vue';
import { useItemModuleStore } from '@/modules/item/store';

import {
  item_class_options,
  item_subclass_options,
  item_quality_options,
  inventory_type_options,
  honor_rank_options,
  reputation_rank_options,
  stat_type_options,
  damage_type_options,
  spell_trigger_options,
  bonding_options,
  language_options,
  material_options,
  sheath_options,
  socket_color_options,
  bag_family_options,
  totem_category_options,
  food_type_options,
  ITEM_FLAGS,
  ITEM_FLAGS_EXTRA,
  ALLOWABLE_CLASS,
  ALLOWABLE_RACE,
} from '@/modules/item/types/defines';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useItemModuleStore();

const itemEntry = computed(() => {
  const param = route.params.entry as string | undefined;
  if (!param || param === 'new') return null;
  const n = Number(param);
  return Number.isNaN(n) ? null : n;
});

const loading = ref(false);
const form = store.formData;

// Convert options to PrimeVue format
const classOptions = item_class_options.map((o) => ({ value: o.value, label: o.name }));
const subclassOptions = item_subclass_options.map((o) => ({ value: o.value, label: o.name }));
const qualityOptions = item_quality_options.map((o) => ({ value: o.value, label: o.name }));
const inventoryTypeOptions = inventory_type_options.map((o) => ({ value: o.value, label: o.name }));
const honorRankOptions = honor_rank_options.map((o) => ({ value: o.value, label: o.name }));
const reputationRankOptions = reputation_rank_options.map((o) => ({ value: o.value, label: o.name }));
const statTypeOptions = stat_type_options.map((o) => ({ value: o.value, label: o.name }));
const damageTypeOptions = damage_type_options.map((o) => ({ value: o.value, label: o.name }));
const spellTriggerOptions = spell_trigger_options.map((o) => ({ value: o.value, label: o.name }));
const bondingOptions = bonding_options.map((o) => ({ value: o.value, label: o.name }));
const languageOptions = language_options.map((o) => ({ value: o.value, label: o.name }));
const materialOptions = material_options.map((o) => ({ value: o.value, label: o.name }));
const sheathOptions = sheath_options.map((o) => ({ value: o.value, label: o.name }));
const socketColorOptions = socket_color_options.map((o) => ({ value: o.value, label: o.name }));
// bagFamilyOptions is already BitmaskOption[] from defines.ts - use directly
const totemCategoryOptions = totem_category_options.map((o) => ({ value: o.value, label: o.name }));
const foodTypeOptions = food_type_options.map((o) => ({ value: o.value, label: o.name }));

const modifiedFieldSet = computed(() => new Set(store.combinedChangedFields.map(c => c.field)));

function isFieldModified(field: string): boolean {
  return modifiedFieldSet.value.has(field);
}

async function load() {
  loading.value = true;
  try {
    if (itemEntry.value != null) {
      await store.openEditor(itemEntry.value);
    } else {
      await store.openEditor('new');
    }
  } finally {
    loading.value = false;
  }
}

async function save() {
  try {
    await store.saveItem();
    router.push('/item');
  } catch (e) {
    console.error('Failed to save item:', e);
  }
}

function onClose() {
  router.push('/item');
}

function onDiscard() {
  store.discardChanges();
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="item-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="editor-header-left">
        <Button
          icon="pi pi-arrow-left"
          :label="t('itemEditor.back')"
          severity="secondary"
          @click="onClose"
          class="back-button"
        />
        <h1 class="editor-title">
          {{ t('itemEditor.editorTitle') }} <span v-if="form.name">{{ form.name }}</span> #{{ form.entry }}
        </h1>
      </div>
      <div class="editor-header-right">
        <Button
          icon="pi pi-undo"
          :label="t('itemEditor.discard')"
          @click="onDiscard"
          :disabled="!store.combinedHasChanges"
          class="discard-button"
        />
        <Button
          icon="pi pi-play"
          :label="t('itemEditor.execute')"
          @click="save"
          :disabled="!store.combinedHasChanges"
          class="execute-button"
        />
      </div>
    </div>

    <!-- SQL Query Panel -->
    <SqlQueryPanel
      :diffQuery="store.combinedDiffQuery"
      :fullQuery="store.combinedFullQuery"
      :hasChanges="store.combinedHasChanges"
      :changedFields="store.combinedChangedFields"
    />

    <!-- Tabs -->
    <Tabs value="0">
          <TabList>
            <Tab value="0">{{ t('itemEditor.tabs.general') }}</Tab>
            <Tab value="1">{{ t('itemEditor.tabs.requirements') }}</Tab>
            <Tab value="2">{{ t('itemEditor.tabs.stats') }}</Tab>
            <Tab value="3">{{ t('itemEditor.tabs.misc') }}</Tab>
          </TabList>

          <TabPanels>
            <!-- General Tab -->
            <TabPanel value="0">
              <!-- Basic Information -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.basic') }}</h4>
                  <p>{{ t('itemEditor.groups.basicDesc') }}</p>
                </div>

                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.entry')" :modified="isFieldModified('entry')">
                    <InputNumber v-model="form.entry" :disabled="itemEntry != null" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.name')" :modified="isFieldModified('name')">
                    <InputText v-model="form.name" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.class')" :modified="isFieldModified('class')">
                    <Select v-model="form.class" :options="classOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.subclass')" :modified="isFieldModified('subclass')">
                    <Select v-model="form.subclass" :options="subclassOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.SoundOverrideSubclass')" :modified="isFieldModified('SoundOverrideSubclass')">
                    <InputNumber v-model="form.SoundOverrideSubclass" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Display & Quality -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.display') }}</h4>
                  <p>{{ t('itemEditor.groups.displayDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.displayid')" :modified="isFieldModified('displayid')">
                    <InputNumber v-model="form.displayid" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.Quality')" :modified="isFieldModified('Quality')">
                    <Select v-model="form.Quality" :options="qualityOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.InventoryType')" :modified="isFieldModified('InventoryType')">
                    <Select v-model="form.InventoryType" :options="inventoryTypeOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ItemLevel')" :modified="isFieldModified('ItemLevel')">
                    <InputNumber v-model="form.ItemLevel" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Economy -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.economy') }}</h4>
                  <p>{{ t('itemEditor.groups.economyDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.BuyPrice')" :modified="isFieldModified('BuyPrice')">
                    <InputNumber v-model="form.BuyPrice" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.SellPrice')" :modified="isFieldModified('SellPrice')">
                    <InputNumber v-model="form.SellPrice" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.BuyCount')" :modified="isFieldModified('BuyCount')">
                    <InputNumber v-model="form.BuyCount" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Inventory -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.inventory') }}</h4>
                  <p>{{ t('itemEditor.groups.inventoryDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.stackable')" :modified="isFieldModified('stackable')">
                    <InputNumber v-model="form.stackable" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.maxcount')" :modified="isFieldModified('maxcount')">
                    <InputNumber v-model="form.maxcount" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ContainerSlots')" :modified="isFieldModified('ContainerSlots')">
                    <InputNumber v-model="form.ContainerSlots" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.bonding')" :modified="isFieldModified('bonding')">
                    <Select v-model="form.bonding" :options="bondingOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Description -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.fields.description') }}</h4>
                  <p>Item description text</p>
                </div>
                <EditorField :label="t('itemEditor.fields.description')" :modified="isFieldModified('description')">
                  <Textarea v-model="form.description" rows="3" fluid />
                </EditorField>
              </div>
            </TabPanel>

            <!-- Requirements Tab -->
            <TabPanel value="1">
              <!-- Level Requirements -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.level') }}</h4>
                  <p>{{ t('itemEditor.groups.levelDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.RequiredLevel')" :modified="isFieldModified('RequiredLevel')">
                    <InputNumber v-model="form.RequiredLevel" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RequiredSkill')" :modified="isFieldModified('RequiredSkill')">
                    <InputNumber v-model="form.RequiredSkill" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RequiredSkillRank')" :modified="isFieldModified('RequiredSkillRank')">
                    <InputNumber v-model="form.RequiredSkillRank" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.requiredspell')" :modified="isFieldModified('requiredspell')">
                    <InputNumber v-model="form.requiredspell" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.requiredhonorrank')" :modified="isFieldModified('requiredhonorrank')">
                    <Select v-model="form.requiredhonorrank" :options="honorRankOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Reputation Requirements -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.reputation') }}</h4>
                  <p>{{ t('itemEditor.groups.reputationDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.RequiredReputationFaction')" :modified="isFieldModified('RequiredReputationFaction')">
                    <InputNumber v-model="form.RequiredReputationFaction" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RequiredReputationRank')" :modified="isFieldModified('RequiredReputationRank')">
                    <Select v-model="form.RequiredReputationRank" :options="reputationRankOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Class & Race Restrictions -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.classRace') }}</h4>
                  <p>{{ t('itemEditor.groups.classRaceDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.AllowableClass')" :modified="isFieldModified('AllowableClass')">
                    <BitmaskField v-model="form.AllowableClass" :options="ALLOWABLE_CLASS" label="Allowable Class" allow-negative-one />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.AllowableRace')" :modified="isFieldModified('AllowableRace')">
                    <BitmaskField v-model="form.AllowableRace" :options="ALLOWABLE_RACE" label="Allowable Race" allow-negative-one />
                  </EditorField>
                </div>
              </div>

              <!-- Location Restrictions -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.location') }}</h4>
                  <p>{{ t('itemEditor.groups.locationDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.area')" :modified="isFieldModified('area')">
                    <InputNumber v-model="form.area" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.Map')" :modified="isFieldModified('Map')">
                    <InputNumber v-model="form.Map" fluid />
                  </EditorField>
                </div>
              </div>
            </TabPanel>

            <!-- Stats Tab -->
            <TabPanel value="2">
              <!-- Item Stats (1-10) -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.stats') }}</h4>
                  <p>{{ t('itemEditor.groups.statsDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.StatsCount')" :modified="isFieldModified('StatsCount')">
                    <InputNumber v-model="form.StatsCount" fluid />
                  </EditorField>

                  <template v-for="i in 10" :key="`stat-${i}`">
                    <EditorField :label="`${t('itemEditor.fields.stat_type')} ${i}`" :modified="isFieldModified(`stat_type${i}`)">
                      <Select v-model="(form as any)[`stat_type${i}`]" :options="statTypeOptions" optionLabel="label" optionValue="value" fluid />
                    </EditorField>

                    <EditorField :label="`${t('itemEditor.fields.stat_value')} ${i}`" :modified="isFieldModified(`stat_value${i}`)">
                      <InputNumber v-model="(form as any)[`stat_value${i}`]" fluid />
                    </EditorField>
                  </template>

                  <EditorField :label="t('itemEditor.fields.ScalingStatDistribution')" :modified="isFieldModified('ScalingStatDistribution')">
                    <InputNumber v-model="form.ScalingStatDistribution" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ScalingStatValue')" :modified="isFieldModified('ScalingStatValue')">
                    <InputNumber v-model="form.ScalingStatValue" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Damage & Defense -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.damage') }}</h4>
                  <p>{{ t('itemEditor.groups.damageDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.dmg_min1')" :modified="isFieldModified('dmg_min1')">
                    <InputNumber v-model="form.dmg_min1" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.dmg_max1')" :modified="isFieldModified('dmg_max1')">
                    <InputNumber v-model="form.dmg_max1" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.dmg_type1')" :modified="isFieldModified('dmg_type1')">
                    <Select v-model="form.dmg_type1" :options="damageTypeOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.dmg_min2')" :modified="isFieldModified('dmg_min2')">
                    <InputNumber v-model="form.dmg_min2" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.dmg_max2')" :modified="isFieldModified('dmg_max2')">
                    <InputNumber v-model="form.dmg_max2" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.dmg_type2')" :modified="isFieldModified('dmg_type2')">
                    <Select v-model="form.dmg_type2" :options="damageTypeOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.armor')" :modified="isFieldModified('armor')">
                    <InputNumber v-model="form.armor" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.delay')" :modified="isFieldModified('delay')">
                    <InputNumber v-model="form.delay" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RangedModRange')" :modified="isFieldModified('RangedModRange')">
                    <InputNumber v-model="form.RangedModRange" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.block')" :modified="isFieldModified('block')">
                    <InputNumber v-model="form.block" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.MaxDurability')" :modified="isFieldModified('MaxDurability')">
                    <InputNumber v-model="form.MaxDurability" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Resistances -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.resistances') }}</h4>
                  <p>{{ t('itemEditor.groups.resistancesDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.holy_res')" :modified="isFieldModified('holy_res')">
                    <InputNumber v-model="form.holy_res" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.fire_res')" :modified="isFieldModified('fire_res')">
                    <InputNumber v-model="form.fire_res" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.nature_res')" :modified="isFieldModified('nature_res')">
                    <InputNumber v-model="form.nature_res" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.frost_res')" :modified="isFieldModified('frost_res')">
                    <InputNumber v-model="form.frost_res" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.shadow_res')" :modified="isFieldModified('shadow_res')">
                    <InputNumber v-model="form.shadow_res" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.arcane_res')" :modified="isFieldModified('arcane_res')">
                    <InputNumber v-model="form.arcane_res" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Spells (1-5) -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.spells') }}</h4>
                  <p>{{ t('itemEditor.groups.spellsDesc') }}</p>
                </div>
                <template v-for="i in 5" :key="`spell-${i}`">
                  <h4 class="spell-header">Spell {{ i }}</h4>
                  <div class="field-grid">
                    <EditorField :label="t('itemEditor.fields.spellid')" :modified="isFieldModified(`spellid_${i}`)">
                      <InputNumber v-model="(form as any)[`spellid_${i}`]" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spelltrigger')" :modified="isFieldModified(`spelltrigger_${i}`)">
                      <Select v-model="(form as any)[`spelltrigger_${i}`]" :options="spellTriggerOptions" optionLabel="label" optionValue="value" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spellcharges')" :modified="isFieldModified(`spellcharges_${i}`)">
                      <InputNumber v-model="(form as any)[`spellcharges_${i}`]" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spellppmRate')" :modified="isFieldModified(`spellppmRate_${i}`)">
                      <InputNumber v-model="(form as any)[`spellppmRate_${i}`]" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spellcooldown')" :modified="isFieldModified(`spellcooldown_${i}`)">
                      <InputNumber v-model="(form as any)[`spellcooldown_${i}`]" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spellcategory')" :modified="isFieldModified(`spellcategory_${i}`)">
                      <InputNumber v-model="(form as any)[`spellcategory_${i}`]" fluid />
                    </EditorField>

                    <EditorField :label="t('itemEditor.fields.spellcategorycooldown')" :modified="isFieldModified(`spellcategorycooldown_${i}`)">
                      <InputNumber v-model="(form as any)[`spellcategorycooldown_${i}`]" fluid />
                    </EditorField>
                  </div>
                </template>
              </div>

              <!-- Gem Sockets -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.sockets') }}</h4>
                  <p>{{ t('itemEditor.groups.socketsDesc') }}</p>
                </div>
                <div class="field-grid">
                  <template v-for="i in 3" :key="`socket-${i}`">
                    <EditorField :label="`${t('itemEditor.fields.socketColor')} ${i}`" :modified="isFieldModified(`socketColor_${i}`)">
                      <Select v-model="(form as any)[`socketColor_${i}`]" :options="socketColorOptions" optionLabel="label" optionValue="value" fluid />
                    </EditorField>

                    <EditorField :label="`${t('itemEditor.fields.socketContent')} ${i}`" :modified="isFieldModified(`socketContent_${i}`)">
                      <InputNumber v-model="(form as any)[`socketContent_${i}`]" fluid />
                    </EditorField>
                  </template>

                  <EditorField :label="t('itemEditor.fields.socketBonus')" :modified="isFieldModified('socketBonus')">
                    <InputNumber v-model="form.socketBonus" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.GemProperties')" :modified="isFieldModified('GemProperties')">
                    <InputNumber v-model="form.GemProperties" fluid />
                  </EditorField>
                </div>
              </div>
            </TabPanel>

            <!-- Misc Tab -->
            <TabPanel value="3">
              <!-- Flags -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.flags') }}</h4>
                  <p>{{ t('itemEditor.groups.flagsDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.Flags')" :modified="isFieldModified('Flags')">
                    <BitmaskField v-model="form.Flags" :options="ITEM_FLAGS" label="Flags" />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.FlagsExtra')" :modified="isFieldModified('FlagsExtra')">
                    <BitmaskField v-model="form.FlagsExtra" :options="ITEM_FLAGS_EXTRA" label="Extra Flags" />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.flagsCustom')" :modified="isFieldModified('flagsCustom')">
                    <InputNumber v-model="form.flagsCustom" fluid />
                  </EditorField>
                </div>
              </div>

              <!-- Advanced -->
              <div class="field-group">
                <div class="field-group-header">
                  <h4>{{ t('itemEditor.groups.advanced') }}</h4>
                  <p>{{ t('itemEditor.groups.advancedDesc') }}</p>
                </div>
                <div class="field-grid">
                  <EditorField :label="t('itemEditor.fields.Material')" :modified="isFieldModified('Material')">
                    <Select v-model="form.Material" :options="materialOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.sheath')" :modified="isFieldModified('sheath')">
                    <Select v-model="form.sheath" :options="sheathOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.BagFamily')" :modified="isFieldModified('BagFamily')">
                    <BitmaskField v-model="form.BagFamily" :options="bag_family_options" label="Bag Family" />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.TotemCategory')" :modified="isFieldModified('TotemCategory')">
                    <Select v-model="form.TotemCategory" :options="totemCategoryOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.PageText')" :modified="isFieldModified('PageText')">
                    <InputNumber v-model="form.PageText" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.LanguageID')" :modified="isFieldModified('LanguageID')">
                    <Select v-model="form.LanguageID" :options="languageOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.PageMaterial')" :modified="isFieldModified('PageMaterial')">
                    <InputNumber v-model="form.PageMaterial" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.startquest')" :modified="isFieldModified('startquest')">
                    <InputNumber v-model="form.startquest" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.lockid')" :modified="isFieldModified('lockid')">
                    <InputNumber v-model="form.lockid" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RandomProperty')" :modified="isFieldModified('RandomProperty')">
                    <InputNumber v-model="form.RandomProperty" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RandomSuffix')" :modified="isFieldModified('RandomSuffix')">
                    <InputNumber v-model="form.RandomSuffix" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.itemset')" :modified="isFieldModified('itemset')">
                    <InputNumber v-model="form.itemset" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RequiredDisenchantSkill')" :modified="isFieldModified('RequiredDisenchantSkill')">
                    <InputNumber v-model="form.RequiredDisenchantSkill" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ArmorDamageModifier')" :modified="isFieldModified('ArmorDamageModifier')">
                    <InputNumber v-model="form.ArmorDamageModifier" :minFractionDigits="1" :maxFractionDigits="2" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.duration')" :modified="isFieldModified('duration')">
                    <InputNumber v-model="form.Duration" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ItemLimitCategory')" :modified="isFieldModified('ItemLimitCategory')">
                    <InputNumber v-model="form.ItemLimitCategory" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.HolidayId')" :modified="isFieldModified('HolidayId')">
                    <InputNumber v-model="form.HolidayId" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ScriptName')" :modified="isFieldModified('ScriptName')">
                    <InputText v-model="form.ScriptName" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.DisenchantID')" :modified="isFieldModified('DisenchantID')">
                    <InputNumber v-model="form.DisenchantID" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.FoodType')" :modified="isFieldModified('FoodType')">
                    <Select v-model="form.FoodType" :options="foodTypeOptions" optionLabel="label" optionValue="value" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.minMoneyLoot')" :modified="isFieldModified('minMoneyLoot')">
                    <InputNumber v-model="form.minMoneyLoot" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.maxMoneyLoot')" :modified="isFieldModified('maxMoneyLoot')">
                    <InputNumber v-model="form.maxMoneyLoot" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.ammo_type')" :modified="isFieldModified('ammo_type')">
                    <InputNumber v-model="form.ammo_type" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.RequiredCityRank')" :modified="isFieldModified('RequiredCityRank')">
                    <InputNumber v-model="form.RequiredCityRank" fluid />
                  </EditorField>

                  <EditorField :label="t('itemEditor.fields.VerifiedBuild')" :modified="isFieldModified('VerifiedBuild')">
                    <InputNumber v-model="form.VerifiedBuild" fluid />
                  </EditorField>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.editor-header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.editor-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(51, 65, 85, 0.6) !important;
  color: #e2e8f0 !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.25rem !important;
  transition: all 0.2s !important;
}

.back-button:hover {
  background: rgba(51, 65, 85, 0.9) !important;
  border-color: rgba(71, 85, 105, 0.8) !important;
  color: #ffffff !important;
}

.execute-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.execute-button:hover {
  background: linear-gradient(135deg, #22d3ee, #06b6d4) !important;
}

.discard-button {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: none !important;
  color: #fff !important;
  font-weight: 600 !important;
  padding: 0.65rem 1.5rem !important;
  border-radius: 0.5rem !important;
}

.discard-button:hover {
  background: linear-gradient(135deg, #f87171, #e75151) !important;
}

.editor-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #22d3ee;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spell-header {
  grid-column: 1 / -1;
  font-size: 0.95rem;
  font-weight: 500;
  color: #cbd5e1;
  margin: 1rem 0 0.5rem 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(51, 65, 85, 0.4);
}

.spell-header:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

</style>
