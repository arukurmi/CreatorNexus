export const MIN_BUDGET = 5000
export const SLIDER_MAX_BUDGET = 200_000
/** Mirrors the backend's budgetSchema cap (₹1 crore). */
export const MAX_BUDGET = 10_000_000

export function clampBudget(value: number): number {
  if (Number.isNaN(value)) return MIN_BUDGET
  return Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, Math.round(value)))
}
