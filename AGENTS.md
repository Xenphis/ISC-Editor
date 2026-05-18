# ISC Editor — Agent Guidelines

## Project Overview

ISC Editor is a desktop application built with **Tauri** (Rust backend) + **Vue 3** (TypeScript frontend) for editing World of Warcraft emulator server databases (AzerothCore / TrinityCore). It allows server administrators to manage NPCs, game objects, items, quests, maps, loot, and spells through a GUI that generates and applies SQL queries.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + TypeScript, Vite, PrimeVue 4 (TrinityPreset / cyan theme) |
| State | Pinia 3 |
| Routing | vue-router 4 (hash history, auth guard via `connectionStore.isConnected`) |
| i18n | vue-i18n 11 — locales: `en`, `fr` (files under `src/i18n/locales/`) |
| SQL generation | `squel-ts` + `useQueryGenerator` composable |
| Backend | Tauri 2 (Rust) — communicates with a MySQL database |
| Package manager | **pnpm** |

## Build & Run

```bash
# Full Tauri dev app (required for DB features)
pnpm tauri dev

# Production build
pnpm build          # vue-tsc + vite build
pnpm tauri build    # Tauri production bundle
```

## Architecture

### Frontend → Backend communication

All database operations go through `src-tauri/src/commands/`. The frontend calls them exclusively via `invoke()` from `@tauri-apps/api/core`:

```ts
import { invoke } from '@tauri-apps/api/core'
invoke('command_name', { param1, param2 })
```

Never use `fetch` or direct database connections from the frontend.

### Module structure

Each feature module lives in `src/modules/<module_name>/` and follows this layout:

```
<module>/
  service.ts      # All invoke() calls for this module
  store.ts        # Pinia store — reactive state + diff/SQL generation
  types/          # TypeScript interfaces mirroring DB table shapes
  pages/          # Vue route components (list page + editor page)
  i18n/           # Module-specific translation keys (merged into global i18n)
  stores/         # Optional additional Pinia stores for sub-tables
```

### SQL diff pattern

Editors do not run SQL directly. They accumulate changes in Pinia stores (using `SubTableManager`) and generate diff queries via `useQueryGenerator`. Queries are staged in `sessionChanges` store and can be reviewed in the `SqlQueryPanel` before being applied.

### Routing conventions

- All authenticated routes are children of the `AppLayout` component.
- Route paths follow the pattern `/<module>`, `/<module>/new`, `/<module>/:id`.
- Auth guard in `src/router/index.ts` redirects unauthenticated users to `/login`.

## Conventions

- **Path alias**: `@` maps to `src/`. Always use `@/` for imports, never relative paths crossing module boundaries.
- **Types**: Define types in `types/` subdirectory of each module. Mirror DB column names exactly (PascalCase or snake_case as used in the DB schema).
- **Rust commands**: Each command file in `src-tauri/src/commands/` handles one DB table. Register new commands in both `lib.rs` (`invoke_handler!`) and the `mod` declarations.
- **Debug SQL**: Use the `debug_sql!` macro in Rust commands to emit SQL events to the `SqlDebugViewer`. Never log credentials or sensitive values.
- **i18n**: All user-visible strings must use `t('key')`. Add keys to both `en.json` and `fr.json`.
- **PrimeVue components**: Use existing shared components (`EditableDataTable`, `StyledDataTable`, `BitmaskField`, `EditorField`) before creating new ones.

## Key Files

| File | Purpose |
|------|---------|
| `src/stores/SubTableManager.ts` | Reactive sub-table diff tracking |
| `src/composables/useQueryGenerator.ts` | SQL diff query generation |
| `src/stores/sessionChanges.ts` | Staged SQL query session |
| `src/stores/moduleStore.ts` | Cross-module state (active module, pending queries) |
| `src-tauri/src/lib.rs` | Tauri app entry — all command registrations |
| `src-tauri/src/debug.rs` | SQL debug event emission + `debug_sql!` macro |
| `src/router/index.ts` | All route definitions |

## Editor Page Structure

An editor page (e.g. `CreatureTemplateEditor.vue`) follows a fixed layout:

```
<div class="<module>-editor">        ← max-width: 80rem
  <EditorHeader />                   ← back button + title + discard/execute buttons
  <SqlQueryPanel />                  ← diff SQL preview (collapsible)
  <Tabs value="<default-tab>">
    <TabList>
      <Tab value="…">Label</Tab>     ← one per logical section
    </TabList>
    <TabPanels>
      <TabPanel value="…">
        <XxxTab />                   ← extracted tab component (pages/editor/<table>/)
      </TabPanel>
    </TabPanels>
  </Tabs>
</div>
```

### `EditorHeader` props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Module name (i18n key) |
| `subtitle` | `string?` | Record name (e.g. NPC name) |
| `id` | `string \| number?` | Primary key shown as `#<id>` |
| `backLabel` | `string?` | Back button label |
| `hasChanges` | `boolean` | Enables discard/execute buttons |
| `discardLabel` | `string?` | Discard button label |
| `executeLabel` | `string?` | Execute/save button label |

Events: `@back`, `@discard`, `@execute`

### `SqlQueryPanel` props

| Prop | Type | Description |
|------|------|-------------|
| `diffQuery` | `string` | UPDATE/INSERT/DELETE diff SQL |
| `fullQuery` | `string` | Full replacement SQL |
| `hasChanges` | `boolean` | Shows/hides the panel |
| `changedFields` | `ChangedField[]` | List of modified fields |

---

## Tab Component Structure

Each tab is a standalone `.vue` component (no props — it reads the module store directly). It is styled by importing the shared CSS:

```vue
<style scoped>
@import '../npc-editor.css';   <!-- or the equivalent path for your module -->
</style>
```

### Layout anatomy inside a tab

A tab is a flat sequence of **field groups**, each using the `.field-group` class:

```html
<div class="field-group">
  <div class="field-group-header">
    <h4>{{ t('…groups.sectionTitle') }}</h4>
    <p>{{ t('…groups.sectionDesc') }}</p>
  </div>
  <div class="field-grid">           <!-- 3-column grid by default -->
    <EditorField label="…" :modified="isFieldModified('fieldName')">
      <!-- PrimeVue input component -->
    </EditorField>
    …
  </div>
</div>
```

#### CSS classes (defined in `npc-editor.css`)

| Class | Description |
|-------|-------------|
| `.field-group` | Card container — dark bg, border, `border-radius: 0.75rem`, `padding: 1.5rem`, `margin-bottom: 1.5rem` |
| `.field-group-header h4` | Section title — `font-size: 1.1rem`, `color: #e2e8f0` |
| `.field-group-header p` | Section description — `font-size: 0.85rem`, `color: #94a3b8` |
| `.field-grid` | 3-column CSS grid with `gap: 1rem` |

---

## Shared UI Components

### `EditorField`

Wrapper for any single form input. Adds label, optional tooltip, and cyan highlight when the value differs from the DB.

```vue
<EditorField
  label="t('…')"
  :modified="isFieldModified('columnName')"
  :tooltip="t('…')"   <!-- optional -->
  :fullWidth="true"   <!-- optional — spans all 3 columns -->
>
  <InputNumber v-model="form.columnName" :useGrouping="false" fluid />
</EditorField>
```

- `modified` turns the label cyan (`#22d3ee`) and adds a 3 px left border.
- `fullWidth` sets `grid-column: 1 / -1`.
- Always pass `fluid` to PrimeVue inputs so they fill the column width.

### `BitmaskField`

Input for integer bitmask fields. Shows a read-only `InputNumber` with a `…` button that opens a PrimeVue `Dialog` listing all flags as `ToggleSwitch`.

```vue
<EditorField label="t('…')" :modified="isFieldModified('npcflag')">
  <BitmaskField
    v-model="form.npcflag"
    :options="npc_flags"       <!-- BitmaskOption[] from types/defines.ts -->
    :label="t('…')"
  />
</EditorField>
```

Dialog width is fixed at `36rem`.

### `EditableDataTable`

Inline editable `DataTable` for sub-table rows (spells, resistances, locales, etc.).

```vue
<EditableDataTable
  :entries="spellEntries"          <!-- reactive array from store sub-table -->
  :columns="spellColumns"          <!-- ColumnDef[] -->
  :hasChanges="spellHasChanges"
  :maxRows="8"
  :title="t('…groups.spells')"
  :description="t('…groups.spellsDesc')"
  dataKey="Index"
  @add="addSpell"
  @remove="removeSpell"
/>
```

`ColumnDef` types: `'number'`, `'text'`, `'select'`, `'readonly'`. Use `optionsFn` instead of `options` when available choices depend on sibling rows (e.g. to exclude already-used enum values).

---

## Field Modifier Pattern

Each editor exposes an `useXxxFieldModifiers()` composable (e.g. `useNpcFieldModifiers`) that returns helpers to check whether a given field differs from its original DB value:

```ts
const { isFieldModified, isMovementModified, isAddonModified } = useNpcFieldModifiers()
```

Use these exclusively to drive the `:modified` prop of `EditorField`. Never compute diffs inline inside a tab.
