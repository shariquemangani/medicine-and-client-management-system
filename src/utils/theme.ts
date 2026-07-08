export type MetricAccentKey =
  | 'patients'
  | 'staff'
  | 'medicines'
  | 'fees'
  | 'inventory'
  | 'prescriptions'

export const metricAccents: Record<
  MetricAccentKey,
  { cssVar: string; light: string; dark: string; label: string }
> = {
  patients: {
    cssVar: '--metric-patients',
    light: 'hsl(217 91% 60%)',
    dark: 'hsl(217 91% 65%)',
    label: 'Patients',
  },
  staff: {
    cssVar: '--metric-teachers',
    light: 'hsl(262 83% 58%)',
    dark: 'hsl(262 83% 65%)',
    label: 'Staff',
  },
  medicines: {
    cssVar: '--metric-classes',
    light: 'hsl(160 84% 39%)',
    dark: 'hsl(160 84% 45%)',
    label: 'Medicines',
  },
  fees: {
    cssVar: '--metric-fees',
    light: 'hsl(38 92% 50%)',
    dark: 'hsl(38 92% 55%)',
    label: 'Billing',
  },
  inventory: {
    cssVar: '--metric-attendance',
    light: 'hsl(173 80% 40%)',
    dark: 'hsl(173 80% 45%)',
    label: 'Inventory',
  },
  prescriptions: {
    cssVar: '--metric-exams',
    light: 'hsl(350 89% 60%)',
    dark: 'hsl(350 89% 65%)',
    label: 'Prescriptions',
  },
}

/** Light-mode main card shadow class — major cards only (BentoCard, detail headers, login) */
export const mainCardShadow = 'main-card-shadow'

export const glassPanelClass =
  'backdrop-blur-xl bg-[hsl(var(--glass))] border border-[hsl(var(--glass-border))] glass-panel'

/** Theme-aware frosted backdrop — same blur(12px) in light & dark; scrim color only changes */
export const modalOverlayClass = 'dialog-overlay'

/** Radix overlay — blur + open/close fade animation */
export const modalOverlayAnimatedClass =
  'dialog-overlay fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'

export const bentoGridClass =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 auto-rows-min'
