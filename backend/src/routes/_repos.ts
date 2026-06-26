import { makeBrandsRepo } from '../db/brandsRepo.js'
import { makeCampaignsRepo } from '../db/campaignsRepo.js'
import { supabaseDriver } from '../db/supabase.js'

type Repos = { brands: ReturnType<typeof makeBrandsRepo>; campaigns: ReturnType<typeof makeCampaignsRepo> }
let repos: Repos | null = null
export function setRepos(r: Repos) { repos = r }          // test seam
export function getRepos(): Repos {
  if (!repos) { const d = supabaseDriver(); repos = { brands: makeBrandsRepo(d), campaigns: makeCampaignsRepo(d) } }
  return repos
}
