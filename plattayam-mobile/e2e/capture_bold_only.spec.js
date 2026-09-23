const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GALLERY_DIR = 'C:/Users/dharu/.gemini/antigravity/brain/668aaf9d-4336-47e3-9a45-245cec9a7ef2/gallery';
fs.mkdirSync(GALLERY_DIR, { recursive: true });

test.describe('Capture Bold-Only Notifications', () => {
  test('screenshots bold-only notifications in light & dark mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });

    const mockNotifications = [
      {
        id: 201,
        title: 'Cab Seat Request',
        message: 'Bob requested to join your cab to Kottayam Railway Station',
        type: 'cab_request',
        reference_id: '2',
        is_read: false,
        created_at: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: 202,
        title: 'Team Invitation',
        message: 'Alice invited you to join team Neural Hack for InOut 2026',
        type: 'hack_invite',
        reference_id: '1',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 203,
        title: 'Application Accepted',
        message: 'Your application to HackElite was accepted by lead developer',
        type: 'hack_accepted',
        reference_id: '3',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 204,
        title: 'Item Found in Lab 2',
        message: 'Someone reported finding a scientific calculator matching yours',
        type: 'lost_message',
        reference_id: '4',
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    await page.route('**/notifications', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            unread_count: 2,
            notifications: mockNotifications,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.addInitScript(() => {
      if (!window.localStorage.getItem('plattayam.theme')) {
        window.localStorage.setItem('plattayam.theme', 'light');
      }
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

    // 1. Light Mode
    await page.goto('/');
    const bellBtn = page.getByLabel(/Notifications/i).first();
    await bellBtn.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Cab Seat Request')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(GALLERY_DIR, 'bold_only_notifications_light.png') });

    // 2. Dark Mode
    await page.evaluate(() => window.localStorage.setItem('plattayam.theme', 'dark'));
    await page.reload();
    const bellBtnDark = page.getByLabel(/Notifications/i).first();
    await bellBtnDark.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Cab Seat Request')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(GALLERY_DIR, 'bold_only_notifications_dark.png') });
  });
});
