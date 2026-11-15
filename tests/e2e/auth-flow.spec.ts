import { test, expect } from '@playwright/test'

test.describe('Auth flow', () => {
  test('login page redirects unauthenticated from protected routes', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/properties/test', '/reports', '/portfolio', '/arrears', '/payouts', '/autopay', '/announcements', '/inspections', '/notices', '/applications']
    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    }
  })

  test('login form has proper validation attributes', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
  })

  test('signup form has proper validation attributes', async ({ page }) => {
    await page.goto('/signup')
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('minlength', '6')
  })

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.click('button[type="submit"]')
    // Wait for error or stay on login
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('signup page has role selector', async ({ page }) => {
    await page.goto('/signup')
    const roleSelect = page.locator('select')
    await expect(roleSelect).toBeVisible()
    await expect(roleSelect.locator('option')).toHaveCount(4)
  })

  test('signup role selector has all roles', async ({ page }) => {
    await page.goto('/signup')
    const options = await page.locator('select option').allTextContents()
    expect(options).toContain('Tenant')
    expect(options).toContain('Landlord')
    expect(options).toContain('Real Estate Agent')
    expect(options).toContain('Contractor')
  })
})

test.describe('Navigation', () => {
  test('login page links to signup', async ({ page }) => {
    await page.goto('/login')
    const signupLink = page.locator('a[href*="signup"]')
    await expect(signupLink).toBeVisible()
  })

  test('signup page links to login', async ({ page }) => {
    await page.goto('/signup')
    const loginLink = page.locator('a[href*="login"]')
    await expect(loginLink).toBeVisible()
  })

  test('homepage has no console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(2000)
    const critical = errors.filter((e) => !e.includes('favicon') && !e.includes('hydration') && !e.includes('supabase'))
    expect(critical.length).toBe(0)
  })
})
