/**
 * Flag ID format: YYYYMM + serial (e.g. 202607001).
 * Serial increments per calendar month within a category and resets when the month changes (e.g. 202608001).
 */

const MONTH_STAMP_LENGTH = 6
const SERIAL_PAD_LENGTH = 3
const FLAG_ID_PATTERN = /^\d{6}\d{1,3}$/

export function getFlagIdMonthStamp(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}${month}`
}

export function formatFlagId(monthStamp: string, serial: number): string {
  const safeSerial = Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : 1
  return `${monthStamp}${String(safeSerial).padStart(SERIAL_PAD_LENGTH, '0')}`
}

export function isFlagIdForMonth(flagId: string, monthStamp: string): boolean {
  const trimmed = flagId.trim()
  if (!trimmed.startsWith(monthStamp)) return false
  const suffix = trimmed.slice(MONTH_STAMP_LENGTH)
  if (!/^\d+$/.test(suffix)) return false
  return suffix.length >= 1 && suffix.length <= SERIAL_PAD_LENGTH
}

export function parseFlagSerial(flagId: string, monthStamp: string): number | null {
  if (!isFlagIdForMonth(flagId, monthStamp)) return null
  const serial = Number.parseInt(flagId.trim().slice(MONTH_STAMP_LENGTH), 10)
  return Number.isFinite(serial) && serial > 0 ? serial : null
}

export function getNextFlagSerial(existingFlagIds: string[], date: Date = new Date()): number {
  const monthStamp = getFlagIdMonthStamp(date)
  let maxSerial = 0

  for (const flagId of existingFlagIds) {
    const serial = parseFlagSerial(flagId, monthStamp)
    if (serial !== null && serial > maxSerial) {
      maxSerial = serial
    }
  }

  return maxSerial + 1
}

export function buildNextFlagId(existingFlagIds: string[], date: Date = new Date()): string {
  const monthStamp = getFlagIdMonthStamp(date)
  const nextSerial = getNextFlagSerial(existingFlagIds, date)
  return formatFlagId(monthStamp, nextSerial)
}

export function isMonthlyFlagId(flagId: string): boolean {
  return FLAG_ID_PATTERN.test(flagId.trim())
}

export const FLAG_ID_MONTH_STAMP_LENGTH = MONTH_STAMP_LENGTH
export const FLAG_ID_SERIAL_PAD_LENGTH = SERIAL_PAD_LENGTH
