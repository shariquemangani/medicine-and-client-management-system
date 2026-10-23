import { ROUTES } from '@/lib/routes'

import { Pill, Activity, Flag } from 'lucide-react'
import { VaultHubCard } from '@/components/medicines/vault-hub-card'
export function VaultHub() {
  return (
    <div className="vault-hub-grid grid grid-cols-1 gap-4 md:grid-cols-3">
      <VaultHubCard
        href={ROUTES.vaultMedicine}
        title={'Medicine'}
        description={'Browse remedies, potencies, and vault stock for clinical prescribing.'}
        icon={Pill}
        accent="medicine"
        badge={'Remedies'}
        delay={60}
      />
      <VaultHubCard
        href={ROUTES.vaultDiseases}
        title={'Diseases'}
        description={'Maintain condition catalogs used across registration and visits.'}
        icon={Activity}
        accent="diseases"
        badge={'Catalog'}
        delay={140}
      />
      <VaultHubCard
        href={ROUTES.vaultFlags}
        title={'Flag configurations'}
        description={'Define clinical flags, alerts, and workflow signals for care teams.'}
        icon={Flag}
        accent="flags"
        badge={'Signals'}
        delay={220}
      />
    </div>
  )
}
