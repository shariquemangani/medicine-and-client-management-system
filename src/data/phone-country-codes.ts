export const DEFAULT_PHONE_COUNTRY_CODE = '+91'

export type PhoneCountryCode = {
  value: string
  label: string
  digits: number
}

export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { value: '+91', label: '+91', digits: 10 },
  { value: '+92', label: '+92', digits: 10 },
  { value: '+971', label: '+971', digits: 9 },
  { value: '+966', label: '+966', digits: 9 },
  { value: '+880', label: '+880', digits: 10 },
  { value: '+1', label: '+1', digits: 10 },
  { value: '+44', label: '+44', digits: 10 },
]
