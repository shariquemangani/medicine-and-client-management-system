import {
  LEGACY_VAULT_PATH,
  ROUTES,
  SECTION_HREF_BY_SLUG,
} from '@/lib/routes'

export interface AdminBreadcrumbSegment {
  /** i18n key — used when `label` is not set */
  labelKey?: string
  /** Dynamic label (patient name, tab title, etc.) */
  label?: string
  href?: string
}

const SECTION_LABEL_KEYS: Record<string, string> = {
  dashboard: 'nav.dashboard',
  patients: 'nav.patients',
  vault: 'nav.medicines',
  medicines: 'nav.medicines',
  inventory: 'nav.inventory',
  prescriptions: 'nav.prescriptions',
  billing: 'nav.billing',
  settings: 'nav.settings',
}

function sectionSegment(section: string): AdminBreadcrumbSegment | null {
  const labelKey = SECTION_LABEL_KEYS[section]
  const href = SECTION_HREF_BY_SLUG[section]
  if (!labelKey || !href) return null
  return { labelKey, href }
}

export function getAdminBreadcrumbSegments(pathname: string): AdminBreadcrumbSegment[] {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) {
    return [{ labelKey: 'nav.dashboard' }]
  }

  const section = parts[0]
  const sectionCrumb = sectionSegment(section)

  if (!sectionCrumb) {
    return [{ labelKey: 'common.adminPortal' }]
  }

  if (section === 'dashboard') {
    return [{ labelKey: 'nav.dashboard' }]
  }

  if (parts.length === 1) {
    return [{ labelKey: sectionCrumb.labelKey }]
  }

  const child = parts[1]
  const isVault = section === 'vault' || section === LEGACY_VAULT_PATH.slice(1)

  if (section === 'patients') {
    if (child === 'new') {
      return [sectionCrumb, { labelKey: 'patients.addPatient' }]
    }
    return [sectionCrumb, { labelKey: 'common.patientProfile' }]
  }

  if (isVault && parts.length >= 2) {
    if (child === 'medicine') {
      const medicineCrumb: AdminBreadcrumbSegment = {
        labelKey: 'medicines.vaultCardMedicine',
        href: ROUTES.vaultMedicine,
      }
      if (parts[2] === 'new') {
        return [sectionCrumb, medicineCrumb, { labelKey: 'medicines.addMedicine' }]
      }
      if (parts[2]) {
        return [sectionCrumb, medicineCrumb, { labelKey: 'medicines.detail.title' }]
      }
      return [sectionCrumb, { labelKey: 'medicines.vaultCardMedicine' }]
    }
    if (child === 'diseases') {
      const diseasesCrumb = { labelKey: 'medicines.vaultCardDiseases', href: ROUTES.vaultDiseases }
      if (parts[2] === 'new') {
        return [sectionCrumb, diseasesCrumb, { labelKey: 'diseases.addDisease' }]
      }
      if (parts[2]) {
        return [sectionCrumb, diseasesCrumb, { labelKey: 'diseases.detail.title' }]
      }
      return [sectionCrumb, { labelKey: 'medicines.vaultCardDiseases' }]
    }
    if (child === 'flag-configurations') {
      return [sectionCrumb, { labelKey: 'medicines.vaultCardFlags' }]
    }
    return [sectionCrumb, { labelKey: 'common.details' }]
  }

  return [{ labelKey: sectionCrumb.labelKey }]
}
