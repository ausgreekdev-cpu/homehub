import { test, expect } from '@playwright/test'

test.describe('Payment flow', () => {
  test('autopay page loads', async ({ page }) => {
    await page.goto('/autopay')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('payouts page has create payout form', async ({ page }) => {
    await page.goto('/payouts')
    await expect(page.locator('h1')).toContainText('Payouts')
    // Form inputs should be present
    const inputs = page.locator('input')
    await expect(inputs.first()).toBeVisible()
  })

  test('connect-stripe page loads', async ({ page }) => {
    await page.goto('/connect-stripe')
    await expect(page.locator('h1')).toContainText('Connect Stripe')
    await expect(page.locator('button')).toBeVisible()
  })

  test('tenant pay page loads', async ({ page }) => {
    await page.goto('/tenant/pay')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('health endpoint returns service info', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.service).toBe('homehub-web')
    expect(body.timestamp).toBeTruthy()
  })

  test('health deep check returns supabase status', async ({ request }) => {
    const res = await request.get('/api/health?deep=1')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

test.describe('CRUD pages load without errors', () => {
  const pages = [
    { path: '/dashboard', heading: /properties|dashboard/i },
    { path: '/announcements', heading: /announcements/i },
    { path: '/arrears', heading: /arrears/i },
    { path: '/inspections', heading: /inspections/i },
    { path: '/notices', heading: /notices|compliance/i },
    { path: '/reports', heading: /reports/i },
    { path: '/portfolio', heading: /portfolio/i },
    { path: '/applications', heading: /.*/ },
    { path: '/onboarding', heading: /welcome/i },
  ]

  for (const { path, heading } of pages) {
    test(`${path} loads without console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      await page.goto(path)
      await page.waitForTimeout(1000)
      const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('hydration') && !e.includes('supabase'))
      expect(critical.length).toBe(0)
    })
  }
})
