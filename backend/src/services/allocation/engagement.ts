import type { AllocStrategy } from './types.js'
export const engagementStrategy: AllocStrategy = { score: (i) => i.engagement_rate * i.followers }
