import type { AllocStrategy } from './types.js'
// Blended: reward creators strong at BOTH reach and engagement (multiplicative).
export const valueStrategy: AllocStrategy = {
  score: (i) => Math.sqrt(i.avg_views) * (i.engagement_rate * i.followers),
}
