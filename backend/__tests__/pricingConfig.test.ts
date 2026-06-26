import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolvePricingConfig, DEFAULT_PRICING } from '../src/config/pricingConfig.js'

describe('resolvePricingConfig', () => {
  const saved = { ...process.env }
  beforeEach(() => { process.env = { ...saved } })
  afterEach(() => { process.env = { ...saved } })

  it('uses defaults when env empty', () => {
    delete process.env.CPM_MICRO; delete process.env.PRICING_MODEL
    expect(resolvePricingConfig().cpm.micro).toBe(DEFAULT_PRICING.cpm.micro)
    expect(resolvePricingConfig().model).toBe('cpm')
  })

  it('env overrides defaults', () => {
    process.env.CPM_MICRO = '450'
    process.env.PRICING_MODEL = 'weighted'
    const cfg = resolvePricingConfig()
    expect(cfg.cpm.micro).toBe(450)
    expect(cfg.model).toBe('weighted')
  })

  it('malformed env falls back to default, never throws', () => {
    process.env.CPM_MICRO = 'not-a-number'
    process.env.PRICE_SPREAD = ''
    expect(() => resolvePricingConfig()).not.toThrow()
    expect(resolvePricingConfig().cpm.micro).toBe(DEFAULT_PRICING.cpm.micro)
  })
})
