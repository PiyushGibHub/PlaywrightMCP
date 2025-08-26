// @ts-check
const { test, expect } = require('@playwright/test');

test('basic test', async ({ page }) => {
  await test.step('Navigate to homepage', async () => {
    await page.goto('/');
    // This is a basic test that will be overwritten by the generated tests
    await expect(page).toHaveTitle(/Example Domain/);
  });
});
