import type { Medicine } from '@/types'

type ClassWithCount = Medicine & { patientCount?: number }

export function computeClassPageStats(classes: ClassWithCount[]) {
  const totalPatients = classes.reduce(
    (sum, cls) => sum + (cls.patientCount ?? cls.patientIds?.length ?? 0),
    0
  )

  return {
    total: classes.length,
    totalPatients,
    avgSize: classes.length ? Math.round(totalPatients / classes.length) : 0,
    withHomeroom: classes.filter((cls) => cls.homeroomStaffId).length,
  }
}
