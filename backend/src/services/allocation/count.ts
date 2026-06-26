import type { AllocStrategy } from './types.js'
import { valueStrategy } from './value.js'
export const countStrategy: AllocStrategy = valueStrategy
