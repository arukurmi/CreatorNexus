import { z } from 'zod'

export const budgetSchema = z.number().positive().max(10_000_000)
export const creatorCountSchema = z.number().int().positive().max(200)
export const citySchema = z.string().trim().min(1).max(64)
export const isUuid = (id: string) => z.string().uuid().safeParse(id).success
