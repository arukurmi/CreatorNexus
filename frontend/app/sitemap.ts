import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/login', '/strategist?preview=1'].map((path) => ({ url: `${SITE_URL}${path}` }))
}
