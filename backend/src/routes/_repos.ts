import { makeBrandsRepo } from '../db/brandsRepo.js'
import { makeCampaignsRepo } from '../db/campaignsRepo.js'
import { supabaseDriver } from '../db/supabase.js'

type Repos = { brands: ReturnType<typeof makeBrandsRepo>; campaigns: ReturnType<typeof makeCampaignsRepo> }
let repos: Repos | null = null
export function setRepos(r: Repos): void {
  if (process.env.NODE_ENV === 'production') throw new Error('setRepos is a test-only seam')
  repos = r
}
export function __resetRepos(): void { repos = null }
export function getRepos(): Repos {
  if (!repos) { const d = supabaseDriver(); repos = { brands: makeBrandsRepo(d), campaigns: makeCampaignsRepo(d) } }
  return repos
}
