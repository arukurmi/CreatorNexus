import { expect, test } from '@playwright/test'

test('landing page shows the hero and the sign-in / get-started links', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Get Started/ })).toBeVisible()
})

test('landing page advertises an Open Graph image', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /opengraph-image/)
})

test('login page renders the email and password form', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Creator Nexus', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign Up', exact: true })).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
})

test('strategist preview shows the canned result without signing in', async ({ page }) => {
  await page.goto('/strategist?preview=1')
  await expect(page.getByRole('heading', { level: 1, name: /AI Strategist/ })).toBeVisible()
  await expect(page.getByText(/nano-heavy mix maximises authentic reach/)).toBeVisible()
})

test('unknown route returns 404 and the not-found page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
})
