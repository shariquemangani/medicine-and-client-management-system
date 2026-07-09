/**
 * App route paths — single source of truth for sidebar, breadcrumbs,
 * permissions, middleware, and in-app links.
 */

export const ROUTES = {
  home: '/',
  register: '/register',

  dashboard: '/dashboard',

  patients: '/patients',
  patientsNew: '/patients/new',
  patient: (id: string) => `/patients/${id}` as const,

  vault: '/vault',
  vaultMedicine: '/vault/medicine',
  vaultMedicineNew: '/vault/medicine/new',
  vaultMedicineDetail: (id: string) => `/vault/medicine/${id}` as const,
  vaultDiseases: '/vault/diseases',
  vaultDiseaseNew: '/vault/diseases/new',
  vaultDiseaseDetail: (id: string) => `/vault/diseases/${id}` as const,
  vaultFlags: '/vault/flag-configurations',

  inventory: '/inventory',
  prescriptions: '/prescriptions',
  billing: '/billing',
  settings: '/settings',
} as const

/** Legacy path still redirected to the medicine vault. */
export const LEGACY_VAULT_PATH = '/medicines'

/** Top-level sidebar / protected section paths (in display order). */
export const SIDEBAR_SECTION_PATHS = [
  ROUTES.dashboard,
  ROUTES.patients,
  ROUTES.vaultMedicine,
  ROUTES.inventory,
  ROUTES.prescriptions,
  ROUTES.billing,
  ROUTES.settings,
] as const

export type SidebarSectionPath = (typeof SIDEBAR_SECTION_PATHS)[number]

/** Protected paths checked by middleware (includes legacy vault alias). */
export const PROTECTED_PATHS = [
  ...SIDEBAR_SECTION_PATHS,
  ROUTES.vault,
  LEGACY_VAULT_PATH,
] as const

/** Map URL first segment → canonical section href for breadcrumbs. */
export const SECTION_HREF_BY_SLUG: Record<string, string> = {
  dashboard: ROUTES.dashboard,
  patients: ROUTES.patients,
  vault: ROUTES.vaultMedicine,
  medicines: ROUTES.vaultMedicine,
  inventory: ROUTES.inventory,
  prescriptions: ROUTES.prescriptions,
  billing: ROUTES.billing,
  settings: ROUTES.settings,
}
