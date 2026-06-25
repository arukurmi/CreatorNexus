import { Influencer, Niche, Tier } from './types'

// ── Deterministic pseudo-random so the dataset is stable across renders ──────
function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const round = (n: number, step: number) => Math.round(n / step) * step

// Followers per tier (so every niche has nano + micro + macro for its buckets)
const TIER_RANGES: Record<Tier, [number, number]> = {
  nano: [2_000, 9_500],
  micro: [12_000, 95_000],
  macro: [120_000, 650_000],
}

// Engagement is highest for nano, lowest for macro
const ENGAGEMENT_RANGES: Record<Tier, [number, number]> = {
  nano: [0.08, 0.13],
  micro: [0.05, 0.09],
  macro: [0.03, 0.06],
}

function buildInfluencer(handle: string, niche: Niche, tier: Tier): Influencer {
  const rand = seeded(handle)

  const [fMin, fMax] = TIER_RANGES[tier]
  const followers = round(fMin + rand() * (fMax - fMin), 500)

  const [eMin, eMax] = ENGAGEMENT_RANGES[tier]
  const engagement_rate = Math.round((eMin + rand() * (eMax - eMin)) * 1000) / 1000

  // Recent reels typically reach 40–80% of followers
  const avg_views = round(followers * (0.4 + rand() * 0.4), 100)

  // Anchor price from reach + engagement, then a believable min–max spread
  const anchor = followers * 0.04 + (avg_views / 10) * 0.1 + engagement_rate * 8000
  const cost_min = Math.max(300, round(anchor * 0.8, 100))
  const cost_max = round(anchor * (1.4 + rand() * 0.4), 100)

  return {
    id: `${niche}-${handle.replace(/^@/, '')}`,
    handle,
    avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${handle.replace(/^@/, '')}`,
    followers,
    avg_views,
    engagement_rate,
    cost_min,
    cost_max,
    niche,
  }
}

// Niche-themed handle word banks → combined with shared suffixes to mint
// plenty of believable handles (so budgets can actually be exhausted).
const PREFIXES: Record<Niche, string[]> = {
  pets: ['paws', 'meow', 'woof', 'furry', 'tail', 'whiskers', 'purrfect', 'fluffy', 'snout', 'barks'],
  fashion: ['thrift', 'drape', 'stitch', 'vogue', 'street', 'ootd', 'styled', 'fab', 'trend', 'couture'],
  beauty: ['glow', 'blush', 'skin', 'kohl', 'glam', 'dewy', 'tint', 'radiant', 'beauty', 'makeup'],
  food: ['chai', 'masala', 'tiffin', 'bites', 'tadka', 'foodie', 'spice', 'curry', 'crave', 'kitchen'],
  fitness: ['fit', 'gains', 'flex', 'yoga', 'run', 'lift', 'shred', 'core', 'active', 'sweat'],
  travel: ['wander', 'nomad', 'backpack', 'voyage', 'roam', 'trails', 'escape', 'journey', 'explore', 'offbeat'],
  tech: ['gadget', 'byte', 'circuit', 'pixel', 'code', 'gizmo', 'techie', 'digital', 'unbox', 'spec'],
  gaming: ['frag', 'respawn', 'noob', 'clutch', 'loot', 'pixel', 'gamer', 'arcade', 'quest', 'grind'],
  parenting: ['mommy', 'daddy', 'toddler', 'raising', 'parent', 'tiny', 'brood', 'nestle', 'cradle', 'family'],
  finance: ['paisa', 'stocks', 'sip', 'wealth', 'fund', 'money', 'budget', 'invest', 'profit', 'rupee'],
  home: ['decor', 'nest', 'abode', 'cozy', 'interior', 'dwell', 'casa', 'hearth', 'homely', 'space'],
  sustainability: ['eco', 'green', 'zerowaste', 'thrift', 'slow', 'planet', 'conscious', 'reuse', 'earthy', 'sustain'],
  education: ['learn', 'study', 'gyaan', 'scholar', 'exam', 'classroom', 'lesson', 'brainy', 'edu', 'mentor'],
  comedy: ['giggle', 'sketch', 'meme', 'witty', 'punchline', 'comic', 'banter', 'jest', 'lol', 'prank'],
}

const SUFFIXES = ['delhi', 'mumbai', 'blr', 'pune', 'hq', 'daily', 'diaries', 'life', 'gram', 'club', 'tales', 'india', 'world', 'official', 'story', 'co']

// 8 nano + 7 micro + 5 macro = 20 creators per niche
const TIER_PLAN: Tier[] = [
  ...Array<Tier>(8).fill('nano'),
  ...Array<Tier>(7).fill('micro'),
  ...Array<Tier>(5).fill('macro'),
]

function buildNiche(niche: Niche): Influencer[] {
  const rand = seeded(`handles-${niche}`)

  // All prefix+suffix combos, deterministically shuffled
  const combos: string[] = []
  for (const p of PREFIXES[niche]) {
    for (const s of SUFFIXES) combos.push(`@${p}${s}`)
  }
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[combos[i], combos[j]] = [combos[j], combos[i]]
  }

  return TIER_PLAN.map((tier, i) => buildInfluencer(combos[i], niche, tier))
}

export const MOCK_INFLUENCERS: Influencer[] = (
  Object.keys(PREFIXES) as Niche[]
).flatMap((niche) => buildNiche(niche))
