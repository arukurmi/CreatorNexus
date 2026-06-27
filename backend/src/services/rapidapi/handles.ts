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

export const COUNTRY = 'India'

// Indian cities used to tag demo creators (so the optional city filter has data
// to work with even on generated data).
export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
]

export interface CuratedCreator { handle: string; city: string }

// Real, public INDIAN Instagram handles per niche, each tagged with a city —
// used by RapidApiProvider for LIVE lookups. Any handle that 404s is skipped,
// and the niche degrades to generated demo data if none resolve. Tune freely.
export const REAL_HANDLES: Record<Niche, CuratedCreator[]> = {
  pets: [
    { handle: 'thepawfectlife', city: 'Mumbai' }, { handle: 'indianpariahdog', city: 'Bengaluru' },
    { handle: 'thedogfatherindia', city: 'Delhi' }, { handle: 'pawsandpurrr', city: 'Pune' },
  ],
  fashion: [
    { handle: 'komalpandeyofficial', city: 'Mumbai' }, { handle: 'masoomminawala', city: 'Mumbai' },
    { handle: 'sejalkumar1195', city: 'Delhi' }, { handle: 'aashnashroff', city: 'Mumbai' },
    { handle: 'kritika_khurana', city: 'Delhi' },
  ],
  beauty: [
    { handle: 'malvika_sitlani', city: 'Mumbai' }, { handle: 'shreya.jain26', city: 'Delhi' },
    { handle: 'nykaa', city: 'Mumbai' }, { handle: 'sugarcosmetics', city: 'Mumbai' },
  ],
  food: [
    { handle: 'yourfoodlab', city: 'Mumbai' }, { handle: 'sanjeevkapoor', city: 'Mumbai' },
    { handle: 'nishamadhulika', city: 'Delhi' }, { handle: 'chefranveer', city: 'Mumbai' },
  ],
  fitness: [
    { handle: 'rohit_khatri_fitness', city: 'Delhi' }, { handle: 'guru_mann_fitness', city: 'Chandigarh' },
    { handle: 'sapnavyas_rd', city: 'Ahmedabad' }, { handle: 'cult.fit', city: 'Bengaluru' },
  ],
  travel: [
    { handle: 'tanyakhanijow', city: 'Delhi' }, { handle: 'shenaztreasury', city: 'Mumbai' },
    { handle: 'kunalkapoor', city: 'Mumbai' },
  ],
  tech: [
    { handle: 'technicalguruji', city: 'Dubai' }, { handle: 'geekyranjit', city: 'Bengaluru' },
    { handle: 'beebomco', city: 'Delhi' }, { handle: 'trakintech', city: 'Mumbai' },
  ],
  gaming: [
    { handle: 'mortal', city: 'Mumbai' }, { handle: 'dynamo__gaming', city: 'Mumbai' },
    { handle: '8bit_thug', city: 'Mumbai' },
  ],
  parenting: [
    { handle: 'thechampatree', city: 'Delhi' }, { handle: 'mommyingbabela', city: 'Mumbai' },
  ],
  finance: [
    { handle: 'ca.rachanaranade', city: 'Pune' }, { handle: 'sharan_hegde', city: 'Bengaluru' },
    { handle: 'financewithsharan', city: 'Bengaluru' },
  ],
  home: [
    { handle: 'thekeybunch', city: 'Chennai' }, { handle: 'pepperfry', city: 'Mumbai' },
    { handle: 'urbanladder', city: 'Bengaluru' },
  ],
  sustainability: [
    { handle: 'thecuriousjalebi', city: 'Mumbai' }, { handle: 'bare_necessities_zerowaste', city: 'Bengaluru' },
  ],
  education: [
    { handle: 'unacademy', city: 'Bengaluru' }, { handle: 'byjus', city: 'Bengaluru' },
    { handle: 'letstute', city: 'Mumbai' },
  ],
  comedy: [
    { handle: 'bhuvan.bam22', city: 'Delhi' }, { handle: 'mostlysane', city: 'Mumbai' },
    { handle: 'zakirkhan_208', city: 'Mumbai' }, { handle: 'kennethsebastian', city: 'Bengaluru' },
  ],
}
