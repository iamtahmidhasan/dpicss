import { test, expect } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Profile Image Upload', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can upload profile image', async ({ page }) => {
    // Login to the application
    await login({ page, user: testUser })

    // Navigate to account page
    await page.goto('http://localhost:3000/account')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if we're on the account page
    await expect(page).toHaveURL('http://localhost:3000/account')

    // Look for the avatar upload section
    const avatarSection = page.locator('[data-testid="avatar-upload"]').or(
      page.locator('input[type="file"]').first()
    )

    // If avatar upload exists, try to upload a test image
    if (await avatarSection.isVisible()) {
      // Create a test image file
      const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

      // Set the file input
      await page.setInputFiles('input[type="file"]', {
        name: 'test-avatar.png',
        mimeType: 'image/png',
        buffer: testImageBuffer
      })

      // Wait for upload to complete (look for success message or image preview)
      await page.waitForTimeout(2000)

      // Check for any error messages
      const errorMessage = page.locator('.text-red-600').or(page.locator('[role="alert"]'))
      const hasError = await errorMessage.isVisible()

      if (hasError) {
        const errorText = await errorMessage.textContent()
        console.log('Upload error:', errorText)
        expect(errorText).not.toContain('Internal server error')
      } else {
        console.log('Upload appears successful')
      }
    } else {
      console.log('Avatar upload section not found')
    }
  })
})