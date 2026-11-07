import { test, expect } from '@playwright/test'

test.describe('Core flows', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('h1')).toContainText('Create account')
  })

  test('listings page loads', async ({ page }) => {
    await page.goto('/listings')
    await expect(page.locator('h1')).toContainText('Available Rentals')
  })

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.locator('h1')).toContainText('Reports')
  })

  test('portfolio page loads', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(page.locator('h1')).toContainText('Portfolio')
  })

  test('arrears page loads', async ({ page }) => {
    await page.goto('/arrears')
    await expect(page.locator('h1')).toContainText('Arrears')
  })

  test('inspections page loads', async ({ page }) => {
    await page.goto('/inspections')
    await expect(page.locator('h1')).toContainText('Inspections')
  })

  test('notices page loads', async ({ page }) => {
    await page.goto('/notices')
    await expect(page.locator('h1')).toContainText('Compliance Notices')
  })

  test('announcements page loads', async ({ page }) => {
    await page.goto('/announcements')
    await expect(page.locator('h1')).toContainText('Announcements')
  })

  test('tenant portal loads', async ({ page }) => {
    await page.goto('/tenant')
    await expect(page.locator('h1')).toContainText('Tenant Portal')
  })

  test('contractor portal loads', async ({ page }) => {
    await page.goto('/contractor')
    await expect(page.locator('h1')).toContainText('Contractor Portal')
  })
})
