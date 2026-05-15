// ─── SQL string escaping ────────────────────────────────────────────

/**
 * Escape a string for safe inclusion in a SQL literal (single-quoted context).
 * Handles backslashes and single quotes (MySQL style).
 */
export function escapeSQL(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// ─── SQL syntax highlighting (HTML) ────────────────────────────────

/**
 * Returns an HTML string with SQL keywords, strings, fields and numbers
 * wrapped in <span> elements for styling.
 */
export function highlightSql(sql: string): string {
  if (!sql) return ''
  let result = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  result = result.replace(/\b(UPDATE|INSERT INTO|DELETE FROM|SET|WHERE|VALUES|AND|OR|IN|FROM|INTO|NULL)\b/gi, '<span class="sql-keyword">$1</span>')
  result = result.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-string">$1</span>')
  result = result.replace(/(`[^`]+`)/g, '<span class="sql-field">$1</span>')
  result = result.replace(/(?<!<[^>]*)(\b\d+(?:\.\d+)?\b)(?![^<]*>)/g, '<span class="sql-number">$1</span>')

  return result
}

// ─── Display helpers ────────────────────────────────────────────────

/**
 * Format a value for display in a changed-fields table.
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'string') return `'${value}'`
  return String(value)
}
