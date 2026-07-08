/** Fallback homeopathic remedies when vault API returns no items */
export const DEFAULT_MEDICINE_VAULT_OPTIONS = [
  { id: 'arnica', name: 'Arnica Montana' },
  { id: 'belladonna', name: 'Belladonna' },
  { id: 'bryonia', name: 'Bryonia Alba' },
  { id: 'calcarea', name: 'Calcarea Carbonica' },
  { id: 'chamomilla', name: 'Chamomilla' },
  { id: 'crataegus', name: 'Crataegus' },
  { id: 'gelsemium', name: 'Gelsemium' },
  { id: 'ignatia', name: 'Ignatia Amara' },
  { id: 'lycopodium', name: 'Lycopodium Clavatum' },
  { id: 'nux-vomica', name: 'Nux Vomica' },
  { id: 'pulsatilla', name: 'Pulsatilla' },
  { id: 'rhus-tox', name: 'Rhus Toxicodendron' },
  { id: 'sulphur', name: 'Sulphur' },
] as const

export const DEFAULT_DIET_SUGGESTIONS = [
  'Warm water',
  'Light meals',
  'Avoid spicy food',
  'Avoid cold drinks',
  'Fruits',
  'Vegetable soup',
  'Herbal tea',
  'No caffeine',
] as const
