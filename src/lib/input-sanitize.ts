/** Keep only characters valid in phone numbers. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\s()-]/g, '')
}

/** Keep only digits (roll numbers, numeric fields). */
export function sanitizeDigitsInput(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, '')
  return maxLength ? digits.slice(0, maxLength) : digits
}
