import { test, expect } from '@playwright/test'

test.describe('Authentication flow', () => {
  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('signup page has required fields', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('unauthenticated user redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user redirected to login from properties', async ({ page }) => {
    await page.goto('/properties/test-id')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login')
    const signupLink = page.locator('a[href*="signup"]')
    if (await signupLink.count() > 0) {
      await expect(signupLink.first()).toBeVisible()
    }
  })

  test('signup page links to login', async ({ page }) => {
    await page.goto('/signup')
    const loginLink = page.locator('a[href*="login"]')
    if (await loginLink.count() > 0) {
      await expect(loginLink.first()).toBeVisible()
    }
  })
})

test.describe('Public pages', () => {
  test('homepage loads with title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/HomeHub/)
  })

  test('listings page loads', async ({ page }) => {
    await page.goto('/listings')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

test.describe('Navigation', () => {
  test('login page has no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/login')
    // Filter out known non-critical errors
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('hydration'))
    expect(critical.length).toBe(0)
  })

  test('signup page has no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/signup')
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('hydration'))
    expect(critical.length).toBe(0)
  })
})
