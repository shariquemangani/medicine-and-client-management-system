export interface Disease {
  id: string
  name: string
  symptoms?: string[]
  cure?: string
  diet?: string
  precautions?: string
  createdAt: string
}

export interface DiseaseFormValues {
  name: string
  symptoms: string[]
  cure: string
  diet: string
  precautions: string
}

export type DiseaseCreateInput = Pick<Disease, 'name'> & {
  symptoms?: string[]
  cure?: string
  diet?: string
  precautions?: string
}
