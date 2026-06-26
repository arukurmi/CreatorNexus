import type { Niche } from '../../types/index.js'

// Curated handle prefixes per niche; suffixes shared. Used to synthesize
// stable handles for the generated provider and as the seed pool for real lookups.
export const NICHE_PREFIXES: Record<Niche, string[]> = {
  pets: ['paw','furry','whisker','tail'], fashion: ['style','thread','vogue','drape'],
  beauty: ['glow','blush','lumen','sheen'], food: ['spice','forknife','simmer','tandoor'],
  fitness: ['flex','pulse','stride','core'], travel: ['nomad','wander','voyage','trail'],
  tech: ['byte','circuit','pixel','stack'], gaming: ['respawn','loot','pixel','combo'],
  parenting: ['tinytot','momlife','cradle','nestful'], finance: ['rupee','ledger','vault','compound'],
  home: ['hearth','nest','decor','abode'], sustainability: ['evergreen','reuse','sprout','planet'],
  education: ['scholar','chalk','quanta','lexicon'], comedy: ['giggle','jest','meme','punchline'],
}
export const SUFFIXES = ['daily','diaries','official','hq','studio','co','india','tales']
