import type { Disease, DiseaseCreateInput, DiseaseFormValues } from '@/types/disease'

export function diseaseToFormValues(disease: Disease): DiseaseFormValues {
  return {
    name: disease.name ?? '',
    symptoms: [...(disease.symptoms ?? [])],
    cure: disease.cure ?? '',
    diet: disease.diet ?? '',
    precautions: disease.precautions ?? '',
  }
}

export function emptyDiseaseFormValues(): DiseaseFormValues {
  return {
    name: '',
    symptoms: [],
    cure: '',
    diet: '',
    precautions: '',
  }
}

export function formValuesToDiseaseCreateInput(values: DiseaseFormValues): DiseaseCreateInput {
  return {
    name: values.name.trim(),
    symptoms: values.symptoms.map((s) => s.trim()).filter(Boolean),
    cure: values.cure.trim(),
    diet: values.diet.trim(),
    precautions: values.precautions.trim(),
  }
}
