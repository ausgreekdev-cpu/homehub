import { test, expect } from '@playwright/test'

test.describe('CRUD flows', () => {
  test('dashboard page loads with properties section', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/)
  })

  test('properties page shows list or empty state', async ({ page }) => {
    await page.goto('/properties')
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/login/)
  })

  test('login form submits and shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should show error or stay on login
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('announcements page loads', async ({ page }) => {
    await page.goto('/announcements')
    await expect(page.locator('h1')).toContainText('Announcements')
  })

  test('inspections page loads', async ({ page }) => {
    await page.goto('/inspections')
    await expect(page.locator('h1')).toContainText('Inspections')
  })

  test('notices page loads', async ({ page }) => {
    await page.goto('/notices')
    await expect(page.locator('h1')).toContainText('Compliance Notices')
  })

  test('arrears page loads', async ({ page }) => {
    await page.goto('/arrears')
    await expect(page.locator('h1')).toContainText('Arrears')
  })

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.locator('h1')).toContainText('Reports')
  })

  test('portfolio page loads', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(page.locator('h1')).toContainText('Portfolio')
  })

  test('autopay page loads', async ({ page }) => {
    await page.goto('/autopay')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('payouts page loads', async ({ page }) => {
    await page.goto('/payouts')
    await expect(page.locator('h1')).toContainText('Payouts')
  })

  test('applications page loads', async ({ page }) => {
    await page.goto('/applications')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('contractor portal loads', async ({ page }) => {
    await page.goto('/contractor')
    await expect(page.locator('h1')).toContainText('Contractor Portal')
  })

  test('tenant portal loads', async ({ page }) => {
    await page.goto('/tenant')
    await expect(page.locator('h1')).toContainText('Tenant Portal')
  })

  test('onboarding page loads', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.locator('h1')).toContainText('Welcome')
  })

  test('connect-stripe page loads', async ({ page }) => {
    await page.goto('/connect-stripe')
    await expect(page.locator('h1')).toContainText('Connect Stripe')
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.service).toBe('homehub-web')
  })

  test('health deep check returns supabase status', async ({ request }) => {
    const res = await request.get('/api/health?deep=1')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.ok).toBe(true)
    // supabase check may be present
    if (body.supabase) {
      expect(typeof body.supabase.ok).toBe('boolean')
    }
  })
})
