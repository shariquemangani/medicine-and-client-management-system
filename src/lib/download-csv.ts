/** Triggers a browser download of `rows` as a UTF-8 CSV file. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  // Cells that start with = + - @ would run as formulas in Excel/Sheets; prefix them with a quote.
  const neutralise = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v)
  const escape = (value: string | number) =>
    `"${(typeof value === 'number' ? String(value) : neutralise(String(value))).replace(/"/g, '""')}"`
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
  // BOM so Excel opens non-ASCII text correctly.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
