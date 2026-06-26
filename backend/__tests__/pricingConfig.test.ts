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

  it('invalid PRICING_MODEL falls back to "cpm"', () => {
    process.env.PRICING_MODEL = 'engagement_multiplier'
    expect(resolvePricingConfig().model).toBe('cpm')
  })

  it('negative CPM_MICRO falls back to default (not -100)', () => {
    process.env.CPM_MICRO = '-100'
    expect(resolvePricingConfig().cpm.micro).toBe(DEFAULT_PRICING.cpm.micro)
  })

  it('W_NORM_K override is honored', () => {
    process.env.W_NORM_K = '25000'
    expect(resolvePricingConfig().weightedNormK).toBe(25000)
  })

  it('empty W_NORM_K falls back to default 50000', () => {
    process.env.W_NORM_K = ''
    expect(resolvePricingConfig().weightedNormK).toBe(50000)
  })

  it('invalid W_NORM_K falls back to default 50000', () => {
    process.env.W_NORM_K = 'bad'
    expect(resolvePricingConfig().weightedNormK).toBe(50000)
  })
})
