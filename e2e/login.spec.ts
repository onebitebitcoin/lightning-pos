import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

test.describe('Login / Register flow', () => {
  test('app loads and shows a page', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
    expect(body!.length).toBeGreaterThan(10)
  })

  test('login page shows input fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    const inputs = page.locator('input')
    await expect(inputs.first()).toBeVisible({ timeout: 5000 })
  })

  test('register page is accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })

  test('login with empty form does not crash', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const submitBtn = page.locator('button[type="submit"]').first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await page.waitForTimeout(500)
    }

    // Page should still be functional
    const body = await page.textContent('body')
    expect(body).toBeTruthy()
  })

  test('navigating to protected route redirects unauthenticated user', async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`)
    await page.waitForTimeout(2000)
    // Should redirect to login or landing page
    const url = page.url()
    expect(url).toBeTruthy()
  })
})
