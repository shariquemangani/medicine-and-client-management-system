/**
 * Patient ID format: YYYYMM + serial (e.g. 202607026).
 * Serial increments per calendar month and resets when the month changes (e.g. 202608001).
 */

const ROLL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_STAMP_LENGTH = 6
const SERIAL_PAD_LENGTH = 3

export function getPatientRollMonthStamp(visitDate: string): string {
  const trimmed = visitDate.trim()
  if (ROLL_DATE_PATTERN.test(trimmed)) {
    return trimmed.slice(0, 7).replace(/-/g, '')
  }
  return new Date().toISOString().slice(0, 7).replace(/-/g, '')
}

/** @deprecated Use getPatientRollMonthStamp */
export function getPatientRollDateStamp(visitDate: string): string {
  return getPatientRollMonthStamp(visitDate)
}

export function formatPatientRollNumber(visitDate: string, serial: number): string {
  const stamp = getPatientRollMonthStamp(visitDate)
  const safeSerial = Number.isFinite(serial) && serial > 0 ? Math.floor(serial) : 1
  return `${stamp}${String(safeSerial).padStart(SERIAL_PAD_LENGTH, '0')}`
}

export function isPatientRollNumberForMonth(rollNumber: string, monthStamp: string): boolean {
  const trimmed = rollNumber.trim()
  if (!trimmed.startsWith(monthStamp)) return false
  const suffix = trimmed.slice(monthStamp.length)
  if (!/^\d+$/.test(suffix)) return false
  return suffix.length >= 1 && suffix.length <= SERIAL_PAD_LENGTH
}

export function parsePatientRollSerial(rollNumber: string, monthStamp: string): number | null {
  if (!isPatientRollNumberForMonth(rollNumber, monthStamp)) return null
  const serial = Number.parseInt(rollNumber.trim().slice(monthStamp.length), 10)
  return Number.isFinite(serial) && serial > 0 ? serial : null
}

export function getNextPatientRollSerial(existingRollNumbers: string[], visitDate: string): number {
  const monthStamp = getPatientRollMonthStamp(visitDate)
  let maxSerial = 0

  for (const rollNumber of existingRollNumbers) {
    const serial = parsePatientRollSerial(rollNumber, monthStamp)
    if (serial !== null && serial > maxSerial) {
      maxSerial = serial
    }
  }

  return maxSerial + 1
}

export function buildPatientRollNumber(
  visitDate: string,
  existingRollNumbers: string[] = []
): string {
  const nextSerial = getNextPatientRollSerial(existingRollNumbers, visitDate)
  return formatPatientRollNumber(visitDate, nextSerial)
}

export const PATIENT_ROLL_MONTH_STAMP_LENGTH = MONTH_STAMP_LENGTH
