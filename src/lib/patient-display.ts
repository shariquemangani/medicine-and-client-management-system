import type { Patient } from '@/types'
import { DEFAULT_MEDICINE_CATEGORIES } from '@/data/medicine-categories'
import { getPatientInitials } from '@/data/patients-page'
import { t } from '@/lib/labels'
export type PatientNameSource = Pick<Patient, 'firstName' | 'lastName'> & {
  firstNameUr?: string
  lastNameUr?: string
}

const CLASS_NAME_KEYS: Record<string, string> = {
  'Grade 7': 'patients.classNames.grade7',
  'Grade 8': 'patients.classNames.grade8',
  'Grade 9': 'patients.classNames.grade9',
  'Grade 10': 'patients.classNames.grade10',
  'Grade 12': 'patients.classNames.grade12',
  Unassigned: 'patients.classNames.unassigned',
  ...Object.fromEntries(DEFAULT_MEDICINE_CATEGORIES.map((level) => [level.name, level.labelKey])),
}

const RELATION_KEYS: Record<string, string> = {
  Parent: 'patients.relations.parent',
  Mother: 'patients.relations.mother',
  Father: 'patients.relations.father',
  Guardian: 'patients.relations.guardian',
  Grandfather: 'patients.relations.grandfather',
  Grandmother: 'patients.relations.grandmother',
  Uncle: 'patients.relations.uncle',
  Aunt: 'patients.relations.aunt',
  Brother: 'patients.relations.brother',
  Sister: 'patients.relations.sister',
  Other: 'patients.relations.other',
}

export function getPatientDisplayName(patient: PatientNameSource) {
  return `${patient.firstName} ${patient.lastName}`.trim()
}

export function getPatientDisplayInitials(patient: PatientNameSource) {
  return getPatientInitials(patient.firstName, patient.lastName)
}

export function getTranslatedClassName(className: string) {
  const key = CLASS_NAME_KEYS[className]
  return key ? t(key) : className
}

export function getTranslatedGuardianName(name: string, patient?: PatientNameSource) {
  if (name.startsWith('Guardian of ')) {
    const displayName = patient ? getPatientDisplayName(patient) : name.replace('Guardian of ', '')
    return `Guardian of ${displayName}`
  }
  return name
}

export function getTranslatedRelation(relation: string) {
  const key = RELATION_KEYS[relation]
  return key ? t(key) : relation
}
