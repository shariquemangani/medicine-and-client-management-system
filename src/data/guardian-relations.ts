export const GUARDIAN_RELATION_OTHER = 'Other'

export const GUARDIAN_RELATIONS = [
  { value: 'Parent', labelKey: 'patients.relations.parent' },
  { value: 'Father', labelKey: 'patients.relations.father' },
  { value: 'Mother', labelKey: 'patients.relations.mother' },
  { value: 'Guardian', labelKey: 'patients.relations.guardian' },
  { value: 'Grandfather', labelKey: 'patients.relations.grandfather' },
  { value: 'Grandmother', labelKey: 'patients.relations.grandmother' },
  { value: 'Uncle', labelKey: 'patients.relations.uncle' },
  { value: 'Aunt', labelKey: 'patients.relations.aunt' },
  { value: 'Brother', labelKey: 'patients.relations.brother' },
  { value: 'Sister', labelKey: 'patients.relations.sister' },
  { value: GUARDIAN_RELATION_OTHER, labelKey: 'patients.relations.other' },
] as const

const PRESET_VALUES = new Set(GUARDIAN_RELATIONS.map((r) => r.value))

export function isPresetGuardianRelation(relation: string): boolean {
  return PRESET_VALUES.has(relation as (typeof GUARDIAN_RELATIONS)[number]['value'])
}

export function splitGuardianRelation(stored: string) {
  if (isPresetGuardianRelation(stored) && stored !== GUARDIAN_RELATION_OTHER) {
    return { guardianRelation: stored, guardianRelationOther: '' }
  }
  if (stored === GUARDIAN_RELATION_OTHER) {
    return { guardianRelation: GUARDIAN_RELATION_OTHER, guardianRelationOther: '' }
  }
  return { guardianRelation: GUARDIAN_RELATION_OTHER, guardianRelationOther: stored }
}

export function resolveGuardianRelation(relation: string, other?: string): string {
  if (relation === GUARDIAN_RELATION_OTHER) {
    return other?.trim() ?? ''
  }
  return relation
}
