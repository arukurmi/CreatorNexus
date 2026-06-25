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

// Themed handle pools — 3 nano, 3 micro, 1 macro per niche
const HANDLES: Record<Niche, string[]> = {
  pets: ['@fluffychennai', '@meowmumbai', '@pawsofpune', '@bengalurupets', '@delhidoggos', '@thecatcafeblr', '@indianpetparent'],
  fashion: ['@nanofitpune', '@thriftwithtara', '@desistreetstyle', '@indiesareestory', '@mumbaiminimal', '@streetweardelhi', '@voguebyvani'],
  beauty: ['@glowwithgia', '@skinbynisha', '@kajalandco', '@desiglowup', '@beautybybhavna', '@theglossguide', '@makeupbymaya'],
  food: ['@homechefhyb', '@bhelpurigirl', '@chaiandchaos', '@veganmumbaikitchen', '@streetfoodsaga', '@biryanibabes', '@thefoodieflick'],
  fitness: ['@nanofitdelhi', '@runningwithrohan', '@yogawithaditi', '@gymratpune', '@fitfambangalore', '@pilatesbypriya', '@theshreddedsardar'],
  travel: ['@offbeatodisha', '@backpackbabu', '@hillsofhimachal', '@nomadicnaina', '@wanderwithwasim', '@trainsofindia', '@theglobetrottergal'],
  tech: ['@gadgetgully', '@codewithkabir', '@desitechie', '@aiwithanmol', '@unboxbyutsav', '@thegizmoguru', '@techtuesdays'],
  gaming: ['@bgmiwithbholu', '@noobtoprorgaming', '@queenofkills', '@valorantvikram', '@indiangamergirl', '@streamersahil', '@thegamingadda'],
  parenting: ['@momof2mumbai', '@dadjokesdelhi', '@raisingrhea', '@thedesimomdiary', '@toddlertalesblr', '@newmomnotes', '@theparentingpro'],
  finance: ['@paisawithpriya', '@stocksforstudents', '@sipsavvy', '@desifinanceguy', '@cryptochaiwala', '@budgetbabaa', '@themoneymentor'],
  home: ['@tinyflatbig', '@declutterdiaries', '@plantsofpune', '@homewithhaya', '@diydecordivya', '@therentedhome', '@interiorinsider'],
  sustainability: ['@zerowastezoya', '@thrifteddreams', '@ecowithesha', '@plasticfreepune', '@slowfashionsana', '@greenwithgaurav', '@sustainabledesi'],
  education: ['@upscwithuma', '@learnwithlavanya', '@historyhungama', '@scienceforsanya', '@codeclasses', '@examtipsdaily', '@theknowledgenest'],
  comedy: ['@sketchysandeep', '@relatablerimi', '@officehumourhq', '@desimemequeen', '@standupsimran', '@potatoechips', '@thecomedycorner'],
}

function buildNiche(niche: Niche): Influencer[] {
  const handles = HANDLES[niche]
  // 3 nano, 3 micro, 1 macro
  const tiers: Tier[] = ['nano', 'nano', 'nano', 'micro', 'micro', 'micro', 'macro']
  return handles.map((handle, i) => buildInfluencer(handle, niche, tiers[i]))
}

export const MOCK_INFLUENCERS: Influencer[] = (
  Object.keys(HANDLES) as Niche[]
).flatMap((niche) => buildNiche(niche))
