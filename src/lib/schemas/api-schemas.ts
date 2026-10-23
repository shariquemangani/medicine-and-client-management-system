import { z } from 'zod'

/** Trimmed, bounded text. Keeps oversized or non-string payloads out of Firestore. */
const text = (max: number) => z.string().trim().max(max)
const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`)

export const diseaseInputSchema = z.object({
  name: requiredText(120, 'Disease name'),
  symptoms: z.array(text(200)).max(200).optional(),
  cure: text(5000).optional(),
  diet: text(5000).optional(),
  precautions: text(5000).optional(),
})

export const flagCategoryInputSchema = z.object({
  name: requiredText(100, 'Category name'),
})

export const flagUpdateSchema = z.object({
  label: requiredText(100, 'Flag label'),
})

export const flagCreateSchema = z
  .object({
    label: text(100).optional(),
    labels: z.array(text(100)).max(100).optional(),
  })
  .refine((v) => (v.labels?.some(Boolean) ?? false) || Boolean(v.label), {
    message: 'At least one flag label is required',
  })

export const adminUserCreateSchema = z.object({
  name: requiredText(100, 'Name').min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['staff', 'super_admin']),
})
