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

// Real, public Instagram handles per niche — used by RapidApiProvider for LIVE
// lookups (the generated fallback uses the synthesized prefixes above instead).
// Starting set to validate the pipeline; any handle that 404s is skipped, and
// the niche degrades to generated data if none resolve. Tune freely.
export const REAL_HANDLES: Record<Niche, string[]> = {
  pets: ['jiffpom', 'doug_the_pug', 'nala_cat', 'thepawfectlife', 'monkooliveskar', 'lokichihuahua'],
  fashion: ['komalpandeyofficial', 'masoomminawala', 'sejalkumar1195', 'aashnashroff', 'kritika_khurana', 'roposogal'],
  beauty: ['malvika_sitlani', 'shreya.jain26', 'debasree', 'myntra', 'nykaa', 'sugarcosmetics'],
  food: ['yourfoodlab', 'sanjeevkapoor', 'nishamadhulika', 'thebigfatbao', 'foodtalkindia', 'chefranveer'],
  fitness: ['rohit_khatri_fitness', 'guru_mann_fitness', 'sapnavyas_rd', 'cult.fit', 'thefitnessadda'],
  travel: ['tanyakhanijow', 'shenaztreasury', 'wander.with.sky', 'kunalkapoor', 'thebrokebackpacker'],
  tech: ['technicalguruji', 'geekyranjit', 'beebomco', 'c4etech', 'trakintech'],
  gaming: ['mortal', 'dynamo__gaming', '8bit_thug', 'gamingwithkaztro', 'rakazone'],
  parenting: ['thechampatree', 'mommyingbabela', 'firstcryindia', 'rashmi_gaikwad'],
  finance: ['ca.rachanaranade', 'sharan_hegde', 'invest_mindset', 'financewithsharan', 'zerodhaonline'],
  home: ['thekeybunch', 'ourhomestories', 'pepperfry', 'urbanladder', 'homecentreindia'],
  sustainability: ['thecuriousjalebi', 'bare_necessities_zerowaste', 'whomadeyourclothes', 'beejliving'],
  education: ['letstute', 'unacademy', 'byjus', 'khanacademy', 'vedantu_learns'],
  comedy: ['bhuvan.bam22', 'mostlysane', 'zakirkhan_208', 'thatswhatsheeats', 'kennethsebastian'],
}
