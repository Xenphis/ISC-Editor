<script setup lang="ts">
import { ref, computed, watch, onMounted, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import EntityWorkspace from '@/components/workspace/EntityWorkspace.vue'
import EntityListPanel from '@/components/workspace/EntityListPanel.vue'
import InspectorPanel from '@/components/workspace/InspectorPanel.vue'
import WorkspaceEmptyState from '@/components/workspace/WorkspaceEmptyState.vue'
import EditorHeader from '@/components/EditorHeader.vue'
import EditorField from '@/components/EditorField.vue'
import type { GameTele } from '@/modules/map/types/game_tele'
import { useGameTeleStore, generateDiffQuery, generateFullQuery, getChangedFields } from '@/modules/map/stores/game_tele'
import { useTableFieldModifiers } from './useTableFieldModifiers'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGameTeleStore()
const { isFieldModified, changedFields } = useTableFieldModifiers(store, getChangedFields)

const form = store.formData
const originalValue = toRef(store, 'originalValue')
const loading = ref(false)

/** undefined = no selection, null = create mode, number = edit. */
const idParam = computed<number | null | undefined>(() => {
  const param = route.params.id as string | undefined
  if (param === undefined || param === '') return undefined
  if (param === 'new') return null
  const n = Number(param)
  return Number.isNaN(n) ? undefined : n
})

const isNew = computed(() => idParam.value === null)

watch(idParam, async (val) => {
  if (val === undefined) return
  loading.value = true
  try {
    if (val === null) {
      store.openNew()
    } else {
      await store.openEditor(val)
    }
  } catch (e) {
    console.error('Failed to load game tele:', e)
  } finally {
    loading.value = false
  }
}, { immediate: true })

// --- List ---
async function loadEntries() {
  await store.fetchEntries(store.currentSearch || undefined, 50)
}

async function onSearch(query: string) {
  store.currentSearch = query
  await loadEntries()
}

function onSelect(row: GameTele) {
  router.push(`/maps/teleport/${row.id}`)
}

function onAdd() {
  router.push('/maps/teleport/new')
}

async function onRemove(row: GameTele) {
  try {
    await store.deleteEntry(row.id)
    if (idParam.value === row.id) {
      router.push('/maps/teleport')
    }
  } catch (e) {
    console.error('Failed to delete game tele:', e)
  }
}

onMounted(() => {
  if (!store.listLoaded) {
    loadEntries()
  }
})

// --- Editor ---
const diffQuery = computed(() => {
  if (!originalValue.value) return ''
  return generateDiffQuery(originalValue.value, form)
})

const fullQuery = computed(() => generateFullQuery(form))
const hasChanges = computed(() => changedFields.value.length > 0)

const modifiedKeys = computed<Set<string | number>>(() => {
  const set = new Set<string | number>()
  if (hasChanges.value && idParam.value != null) set.add(form.id)
  return set
})

async function onExecute() {
  try {
    const savedId = form.id
    await store.saveEntry()
    await loadEntries()
    if (isNew.value && savedId) {
      router.push(`/maps/teleport/${savedId}`)
    }
  } catch (e) {
    console.error('Failed to save game tele:', e)
  }
}

function onDiscard() {
  if (!isNew.value && originalValue.value) {
    Object.assign(form, originalValue.value)
  }
}
</script>

<template>
  <EntityWorkspace storageKey="maps.teleport">
    <template #list>
      <EntityListPanel
        :items="store.entries"
        :idOf="(r: GameTele) => r.id"
        :titleOf="(r: GameTele) => r.name"
        :metaOf="(r: GameTele) => `#${r.id} · map ${r.map} · ${r.position_x.toFixed(0)}, ${r.position_y.toFixed(0)}`"
        :selectedId="idParam ?? null"
        :modifiedIds="modifiedKeys"
        :loading="store.loading"
        :searchPlaceholder="t('game_tele.searchPlaceholder')"
        removable
        @select="onSelect"
        @add="onAdd"
        @search="onSearch"
        @remove="onRemove"
      />
    </template>

    <template #editor>
      <template v-if="idParam !== undefined">
        <EditorHeader
          :subtitle="form.name || t('game_tele.editorTitle')"
          :id="isNew ? undefined : form.id"
          table="game_tele"
          :showBack="false"
          :hasChanges="hasChanges || isNew"
          :discardLabel="t('editor.discard', 'Annuler')"
          :executeLabel="t('editor.execute', 'Exécuter')"
          @discard="onDiscard"
          @execute="onExecute"
        />

        <div v-if="loading" class="editor-loading">
          <i class="pi pi-spin pi-spinner"></i>
        </div>

        <template v-else>
          <!-- Identification -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('game_tele.groups.identification') }}</h4>
              <p>{{ t('game_tele.groups.identificationDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('game_tele.fields.id')">
                <InputNumber v-model="form.id" :useGrouping="false" :min="0" :disabled="!isNew" fluid />
              </EditorField>
              <EditorField :label="t('game_tele.fields.name')" :modified="isFieldModified('name')" :fullWidth="true">
                <InputText v-model="form.name" fluid />
              </EditorField>
            </div>
          </div>

          <!-- Position -->
          <div class="field-group">
            <div class="field-group-header">
              <h4>{{ t('game_tele.groups.position') }}</h4>
              <p>{{ t('game_tele.groups.positionDesc') }}</p>
            </div>
            <div class="field-grid">
              <EditorField :label="t('game_tele.fields.map')" :modified="isFieldModified('map')">
                <InputNumber v-model="form.map" :useGrouping="false" :min="0" fluid />
              </EditorField>
              <EditorField :label="t('game_tele.fields.position_x')" :modified="isFieldModified('position_x')">
                <InputNumber v-model="form.position_x" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
              </EditorField>
              <EditorField :label="t('game_tele.fields.position_y')" :modified="isFieldModified('position_y')">
                <InputNumber v-model="form.position_y" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
              </EditorField>
              <EditorField :label="t('game_tele.fields.position_z')" :modified="isFieldModified('position_z')">
                <InputNumber v-model="form.position_z" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
              </EditorField>
              <EditorField :label="t('game_tele.fields.orientation')" :modified="isFieldModified('orientation')">
                <InputNumber v-model="form.orientation" :useGrouping="false" :minFractionDigits="0" :maxFractionDigits="6" fluid />
              </EditorField>
            </div>
          </div>
        </template>
      </template>

      <WorkspaceEmptyState v-else />
    </template>

    <template #inspector>
      <InspectorPanel
        v-if="idParam !== undefined"
        :title="t('workspace.inspector')"
        :subtitle="form.name || undefined"
        storageKey="maps.teleport"
        :changedFields="changedFields"
        :diffQuery="diffQuery"
        :fullQuery="fullQuery"
        :hasChanges="hasChanges"
      >
        <template #facts>
          <dl class="ws-facts">
            <div class="ws-facts-row">
              <dt>{{ t('game_tele.fields.map') }}</dt>
              <dd>{{ form.map }}</dd>
            </div>
            <div class="ws-facts-row">
              <dt>{{ t('game_tele.fields.position') }}</dt>
              <dd>{{ form.position_x.toFixed(1) }}, {{ form.position_y.toFixed(1) }}, {{ form.position_z.toFixed(1) }}</dd>
            </div>
          </dl>
        </template>
      </InspectorPanel>
    </template>
  </EntityWorkspace>
</template>

<style scoped>
@import './editor/map-editor.css';

.editor-loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
  color: var(--accent);
  font-size: 1.5rem;
}

.ws-facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ws-facts-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.78rem;
}

.ws-facts-row dt {
  color: var(--text-muted);
}

.ws-facts-row dd {
  margin: 0;
  color: var(--text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>
