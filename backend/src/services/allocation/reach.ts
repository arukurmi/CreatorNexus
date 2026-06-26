import type { AllocStrategy } from './types.js'
export const reachStrategy: AllocStrategy = { score: (i) => i.avg_views }
