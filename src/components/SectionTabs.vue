<script setup lang="ts">
import { ref, watch } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

export interface SectionTabItem {
  /** Unique value used as tab id and slot name. */
  value: string
  /** Label shown in the tab strip. */
  label: string
  /** Optional small count badge appended to the label, e.g. (3). */
  count?: number | string
  /** When true, displays a cyan modified dot on the tab. */
  modified?: boolean
  /** Disables the tab. */
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  tabs: SectionTabItem[]
  /** Initially selected tab value. Defaults to the first tab. */
  defaultValue?: string
  /** Optional header title for the card. */
  title?: string
  /** Optional header description shown under the title. */
  description?: string
  /** Highlights the card border in cyan when true. */
  modified?: boolean
}>(), {
  modified: false,
})

const active = ref<string>(props.defaultValue ?? props.tabs[0]?.value ?? '')

// Keep selection valid when the tabs list changes.
watch(() => props.tabs.map(t => t.value).join('|'), () => {
  if (!props.tabs.some(t => t.value === active.value)) {
    active.value = props.tabs[0]?.value ?? ''
  }
})
</script>

<template>
  <div class="section-tabs" :class="{ 'section-tabs-modified': modified }">
    <div v-if="title || description" class="section-tabs-header">
      <h4 v-if="title">{{ title }}</h4>
      <p v-if="description">{{ description }}</p>
    </div>

    <Tabs v-model:value="active" class="section-tabs-inner">
      <TabList>
        <Tab
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          :disabled="tab.disabled"
        >
          <span class="section-tab-label">
            <span
              v-if="tab.modified"
              class="section-tab-dot"
              aria-hidden="true"
            />
            {{ tab.label }}
            <span v-if="tab.count != null" class="section-tab-count">({{ tab.count }})</span>
          </span>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel v-for="tab in tabs" :key="tab.value" :value="tab.value">
          <slot :name="tab.value" :tab="tab" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<style scoped>
.section-tabs {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.4);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s, background 0.2s;
}

.section-tabs-modified {
  border-color: rgba(6, 182, 212, 0.4);
  background: rgba(6, 182, 212, 0.03);
}

.section-tabs-header {
  margin-bottom: 1rem;
}

.section-tabs-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.25rem 0;
}

.section-tabs-header p {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.section-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.section-tab-count {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.section-tab-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
}

/* PrimeVue Tabs theming — matches the global editor look */
:deep(.p-tabs),
:deep(.p-tablist),
:deep(.p-tablist-content),
:deep(.p-tabpanels),
:deep(.p-tabpanel) {
  background: transparent !important;
}

:deep(.p-tablist) {
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

:deep(.p-tablist-tab-list) {
  background: transparent !important;
  border: none !important;
}

:deep(.p-tab) {
  color: #94a3b8 !important;
  background: rgba(2, 6, 23, 0.5) !important;
  border: 1px solid rgba(51, 65, 85, 0.4) !important;
  border-bottom: none !important;
  border-radius: 0.5rem 0.5rem 0 0 !important;
  padding: 0.55rem 1rem !important;
  margin-right: 0.25rem !important;
}

:deep(.p-tab:hover) {
  color: #e2e8f0 !important;
  background: rgba(30, 41, 59, 0.6) !important;
}

:deep(.p-tab-active),
:deep(.p-tab[data-p-active="true"]),
:deep(.p-tab[aria-selected="true"]) {
  color: #22d3ee !important;
  background: rgba(30, 41, 59, 0.9) !important;
  border-color: rgba(6, 182, 212, 0.4) !important;
  border-bottom: 2px solid #22d3ee !important;
}

:deep(.p-tablist-active-bar) {
  background: #22d3ee !important;
}

:deep(.p-tabpanels) {
  padding: 1rem 0 0 0 !important;
}

:deep(.p-tabpanel) {
  padding: 0 !important;
}

/* Embedded EditableDataTable inside a tab should not duplicate the card padding/border. */
:deep(.section-tabs-inner .editable-table-wrapper) {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
}
</style>
