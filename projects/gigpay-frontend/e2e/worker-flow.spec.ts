import { test, expect } from '@playwright/test'

test.describe('Worker Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('landing page loads', async ({ page }) => {
    await expect(page.getByText('GigPay')).toBeVisible()
    await expect(page.getByText('Connect Wallet')).toBeVisible()
  })

  test('worker dashboard requires wallet connection', async ({ page }) => {
    await page.goto('/worker')
    // Should redirect to landing when no wallet connected
    await expect(page).toHaveURL('/')
  })

  test('worker can navigate to dashboard after connecting', async ({ page }) => {
    // TODO: Connect KMD wallet in test
    // await connectWallet(page)
    // await page.goto('/worker')
    // await expect(page.getByText('Worker Dashboard')).toBeVisible()
  })

  test('worker registration flow', async ({ page }) => {
    // TODO: Connect wallet, navigate to worker dashboard
    // Verify registration form appears for unregistered worker
    // Submit registration
    // Verify dashboard appears with earnings card
  })

  test('task submission flow', async ({ page }) => {
    // TODO: Register worker, submit delivery proof
    // Verify task appears in history
  })
})
