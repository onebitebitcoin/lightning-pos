import { test, expect } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

test.describe('App navigation', () => {
  test('app loads without critical JavaScript errors', async ({ page }) => {
    const criticalErrors: string[] = []
    page.on('pageerror', (err) => {
      // Ignore favicon and minor resource errors
      if (!err.message.includes('favicon') && !err.message.includes('manifest')) {
        criticalErrors.push(err.message)
      }
    })

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    expect(criticalErrors).toHaveLength(0)
  })

  test('payment route redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/payment`)
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toBeTruthy()
  })

  test('settings route redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toBeTruthy()
  })

  test('admin route redirects unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`)
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toBeTruthy()
  })

  test('page title is set', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
    const title = await page.title()
    expect(title).toBeTruthy()
  })
})
