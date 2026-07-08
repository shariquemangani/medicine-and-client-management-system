export interface Disease {
  id: string
  name: string
  createdAt: string
}

export type DiseaseCreateInput = Pick<Disease, 'name'>
