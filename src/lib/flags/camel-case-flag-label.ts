/** Normalize user input to camelCase for flag labels and values. */
export function toCamelCaseFlagLabel(input: string): string {
  const words = input
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)

  if (words.length === 0) return ''

  return words
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index === 0) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}
