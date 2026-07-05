import { describe, expect, it } from 'vitest'
import {
  generateCompositeKeyDiffStatements,
  generateDeleteQuery,
  generateDiffQuery,
  generateFullQueryStatements,
  generateUpsertQuery,
  getChangedFields,
  type CompositeKeyConfig,
} from '@/composables/useQueryGenerator'
import { escapeSQL, sqlText, toSqlLiteral } from '@/utils/sql'

describe('escapeSQL / toSqlLiteral', () => {
  it('escapes quotes and backslashes exactly once', () => {
    expect(escapeSQL("o'brien")).toBe("o\\'brien")
    expect(escapeSQL('back\\slash')).toBe('back\\\\slash')
    expect(toSqlLiteral("fr'--")).toBe("'fr\\'--'")
  })

  it('renders scalars', () => {
    expect(toSqlLiteral(null)).toBe('NULL')
    expect(toSqlLiteral(undefined)).toBe('NULL')
    expect(toSqlLiteral(3.5)).toBe('3.5')
    expect(toSqlLiteral(NaN)).toBe('NULL')
    expect(toSqlLiteral(true)).toBe('1')
    expect(toSqlLiteral(false)).toBe('0')
  })

  it('treats empty text as NULL in sqlText', () => {
    expect(sqlText('')).toBe('NULL')
    expect(sqlText(null)).toBe('NULL')
    expect(sqlText('hello')).toBe("'hello'")
  })
})

describe('generateDiffQuery', () => {
  it('returns empty string when nothing changed', () => {
    const row = { entry: 1, name: 'Wolf', scale: 1 }
    expect(generateDiffQuery('creature_template', 'entry', row, { ...row })).toBe('')
  })

  it('updates only changed columns and escapes strings once', () => {
    const sql = generateDiffQuery(
      'creature_template',
      'entry',
      { entry: 100, name: 'old', subname: null },
      { entry: 100, name: "o'brien", subname: null },
    )
    expect(sql).toBe("UPDATE `creature_template` SET `name` = 'o\\'brien' WHERE (`entry` = 100);")
  })

  it('detects small float changes (no tolerance)', () => {
    const sql = generateDiffQuery(
      't', 'id',
      { id: 1, scale: 1.0 },
      { id: 1, scale: 1.0000005 },
    )
    expect(sql).toContain('`scale` = 1.0000005')
  })

  it('quotes and escapes string primary keys in the WHERE clause', () => {
    const sql = generateDiffQuery(
      'npc_text_locale', 'Locale',
      { Locale: "fr'--", Text0_0: 'a' },
      { Locale: "fr'--", Text0_0: 'b' },
    )
    expect(sql).toContain("WHERE (`Locale` = 'fr\\'--')")
  })

  it('treats empty string and null as equal', () => {
    expect(generateDiffQuery('t', 'id', { id: 1, x: null }, { id: 1, x: '' })).toBe('')
  })
})

describe('generateFullQueryStatements', () => {
  it('emits one DELETE and one INSERT with escaped values', () => {
    const [del, ins] = generateFullQueryStatements('creature_text', 'CreatureID', {
      CreatureID: 5,
      Text: "don't",
      GroupID: 0,
    })
    expect(del).toBe('DELETE FROM `creature_text` WHERE (`CreatureID` = 5);')
    expect(ins).toBe("INSERT INTO `creature_text` (`CreatureID`, `Text`, `GroupID`) VALUES (5, 'don\\'t', 0);")
  })
})

describe('generateDeleteQuery', () => {
  it('handles numeric and string keys', () => {
    expect(generateDeleteQuery('t', 'id', 7)).toBe('DELETE FROM `t` WHERE (`id` = 7);')
    expect(generateDeleteQuery('t', 'code', "a'b")).toBe("DELETE FROM `t` WHERE (`code` = 'a\\'b');")
  })
})

describe('generateUpsertQuery', () => {
  it('inserts the full row and only updates changed columns', () => {
    const sql = generateUpsertQuery(
      'creature_template_movement',
      { CreatureId: 3, Ground: 1, Swim: 0 },
      ['Swim'],
    )
    expect(sql).toBe(
      'INSERT INTO `creature_template_movement` (`CreatureId`, `Ground`, `Swim`) VALUES (3, 1, 0) '
      + 'ON DUPLICATE KEY UPDATE `Swim` = VALUES(`Swim`);',
    )
  })
})

describe('generateCompositeKeyDiffStatements', () => {
  interface Row { locale: string, Text: string | null }

  const config: CompositeKeyConfig<Row> = {
    table: 'quest_template_locale',
    parentKey: 'ID',
    parentId: 42,
    childKey: 'locale',
    columns: ['Text'],
    isEqual: (a, b) => a.Text === b.Text,
    toSqlValues: e => [e.Text != null ? `'${escapeSQL(e.Text)}'` : null],
  }

  it('returns nothing when rows are identical', () => {
    const rows: Row[] = [{ locale: 'fr', Text: 'bonjour' }]
    expect(generateCompositeKeyDiffStatements(config, rows, rows.map(r => ({ ...r })))).toEqual([])
  })

  it('deletes removed rows with an escaped child key', () => {
    const stmts = generateCompositeKeyDiffStatements(config, [{ locale: "fr'--", Text: 'x' }], [])
    expect(stmts).toEqual([
      "DELETE FROM `quest_template_locale` WHERE `ID` = 42 AND `locale` = 'fr\\'--';",
    ])
  })

  it('rewrites modified rows as DELETE + INSERT', () => {
    const stmts = generateCompositeKeyDiffStatements(
      config,
      [{ locale: 'fr', Text: 'ancien' }],
      [{ locale: 'fr', Text: "l'actuel" }],
    )
    expect(stmts).toEqual([
      "DELETE FROM `quest_template_locale` WHERE `ID` = 42 AND `locale` = 'fr';",
      "INSERT INTO `quest_template_locale` (`ID`, `locale`, `Text`) VALUES (42, 'fr', 'l\\'actuel');",
    ])
  })

  it('inserts added rows', () => {
    const stmts = generateCompositeKeyDiffStatements(config, [], [{ locale: 'de', Text: null }])
    expect(stmts).toEqual([
      "DELETE FROM `quest_template_locale` WHERE `ID` = 42 AND `locale` = 'de';",
      'INSERT INTO `quest_template_locale` (`ID`, `locale`, `Text`) VALUES (42, \'de\', NULL);',
    ])
  })
})

describe('getChangedFields', () => {
  it('lists changed columns, skipping the primary key', () => {
    const changes = getChangedFields(
      { id: 1, a: 1, b: 'x' },
      { id: 2, a: 1, b: 'y' },
      'id',
    )
    expect(changes).toEqual([{ field: 'b', oldValue: 'x', newValue: 'y' }])
  })
})
