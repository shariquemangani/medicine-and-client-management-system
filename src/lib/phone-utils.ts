import {
  DEFAULT_PHONE_COUNTRY_CODE,
  PHONE_COUNTRY_CODES,
  type PhoneCountryCode,
} from '@/data/phone-country-codes'

export { DEFAULT_PHONE_COUNTRY_CODE, PHONE_COUNTRY_CODES }

export function sanitizeMobileDigits(value: string, maxLength = 15): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

export function getCountryCodeConfig(code: string): PhoneCountryCode {
  return PHONE_COUNTRY_CODES.find((item) => item.value === code) ?? PHONE_COUNTRY_CODES[0]
}

export function formatMobileDisplay(digits: string, countryCode = DEFAULT_PHONE_COUNTRY_CODE): string {
  const sanitized = sanitizeMobileDigits(digits, getCountryCodeConfig(countryCode).digits)
  if (!sanitized) return ''

  if (countryCode === '+91') {
    if (sanitized.length <= 5) return sanitized
    return `${sanitized.slice(0, 5)} ${sanitized.slice(5)}`
  }

  return sanitized.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

export function parsePhoneValue(raw: string): { countryCode: string; number: string } {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: '' }
  }

  const digitsOnly = sanitizeMobileDigits(trimmed)

  if (trimmed.startsWith('+')) {
    const sorted = [...PHONE_COUNTRY_CODES].sort((a, b) => b.value.length - a.value.length)
    for (const country of sorted) {
      const codeDigits = country.value.slice(1)
      if (digitsOnly.startsWith(codeDigits)) {
        return {
          countryCode: country.value,
          number: digitsOnly.slice(codeDigits.length, codeDigits.length + country.digits),
        }
      }
    }
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return { countryCode: '+91', number: digitsOnly.slice(2, 12) }
  }

  if (digitsOnly.length === 10) {
    return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, number: digitsOnly }
  }

  return {
    countryCode: DEFAULT_PHONE_COUNTRY_CODE,
    number: digitsOnly.slice(0, getCountryCodeConfig(DEFAULT_PHONE_COUNTRY_CODE).digits),
  }
}

export function composePhoneValue(countryCode: string, number: string): string {
  const digits = sanitizeMobileDigits(number, getCountryCodeConfig(countryCode).digits)
  if (!digits) return ''
  return `${countryCode}${digits}`
}

export function isValidMobileNumber(countryCode: string, number: string): boolean {
  const digits = sanitizeMobileDigits(number)
  const config = getCountryCodeConfig(countryCode)
  if (digits.length !== config.digits) return false
  if (countryCode === '+91') return /^[6-9]\d{9}$/.test(digits)
  return /^\d+$/.test(digits)
}

export function formatPhoneForDisplay(value: string): string {
  const { countryCode, number } = parsePhoneValue(value)
  if (!number) return ''
  return `${countryCode} ${formatMobileDisplay(number, countryCode)}`
}
