const { test, expect } = require('@playwright/test');

test.describe('AppNavBar and Notifications E2E', () => {
  test('renders top AppNavBar and navigates to Notifications and Profile', async ({ page }) => {
    // Inject mock authenticated session into localStorage so the app renders authenticated stack
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: 'mock-test-jwt-token',
          user_id: 1,
          name: 'Dharun Kumar',
          roll_no: '2021001',
          email_id: 'dharun@iiitkottayam.ac.in',
        })
      );
    });

    await page.goto('/');

    // Check AppNavBar branding
    const brand = page.getByText('Plattayam').first();
    await expect(brand).toBeVisible({ timeout: 10000 });

    // Check Bell Icon button
    const bellBtn = page.getByLabel(/Notifications/i).first();
    await expect(bellBtn).toBeVisible();

    // Check Profile Avatar button with initials
    const avatarBtn = page.getByLabel(/User profile/i).first();
    await expect(avatarBtn).toBeVisible();
    await expect(avatarBtn).toContainText('DK');

    await page.screenshot({ path: 'e2e/screenshots/navbar_home.png' });

    // Tap Bell Icon -> Should navigate to Notifications screen
    await bellBtn.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/notifications_screen.png' });

    // Tap Back button in Notifications -> returns to main screen
    const backBtn = page.getByText('← Back').first();
    await backBtn.click();
    await expect(brand).toBeVisible();

    // Tap Profile Avatar -> Should navigate to Profile screen
    await avatarBtn.click();
    await expect(page.getByText('Your campus account & activity')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/profile_screen.png' });

    // Tap Back button in Profile -> returns to main screen
    const profileBackBtn = page.getByText('← Back').first();
    await profileBackBtn.click();
    await expect(brand).toBeVisible();

    // Verify 3 bottom tabs exist (Cabs, Lost & Found, HackMate)
    await expect(page.getByText('Cabs')).toBeVisible();
    await expect(page.getByText('Lost & Found')).toBeVisible();
    await expect(page.getByText('HackMate')).toBeVisible();
  });
});
