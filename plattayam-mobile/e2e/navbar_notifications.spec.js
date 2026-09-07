const { test, expect } = require('@playwright/test');

test.describe('AppNavBar and Notifications E2E', () => {
  test('renders top AppNavBar with circular red badge for 4 unread notifications and updates reactively', async ({ page }) => {
    let unreadCount = 4;
    let mockNotifications = [
      { id: 101, title: 'Team Invitation', message: 'Alice invited you to join team Neural Hack', type: 'hack_invite', reference_id: '1', is_read: false, created_at: new Date().toISOString() },
      { id: 102, title: 'Cab Seat Request', message: 'Bob requested to join your cab to Kottayam', type: 'cab_request', reference_id: '2', is_read: false, created_at: new Date().toISOString() },
      { id: 103, title: 'Team Application', message: 'Charlie requested to join your team', type: 'hack_request', reference_id: '1', is_read: false, created_at: new Date().toISOString() },
      { id: 104, title: 'New Message', message: 'Lost wallet update from finder', type: 'lost_message', reference_id: '5', is_read: false, created_at: new Date().toISOString() },
    ];

    // Intercept notifications API to return mock notifications
    await page.route('**/notifications', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            unread_count: unreadCount,
            notifications: mockNotifications,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/notifications/read-all', async (route) => {
      unreadCount = 0;
      mockNotifications = mockNotifications.map((n) => ({ ...n, is_read: true }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'All marked read' }),
      });
    });

    await page.route('**/notifications/*/read', async (route) => {
      unreadCount = Math.max(0, unreadCount - 1);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Marked read', is_read: true }),
      });
    });

    // Inject mock authenticated session into localStorage
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

    // Check Bell Icon button with unread count
    const bellBtn = page.getByLabel(/Notifications, 4 unread/i).first();
    await expect(bellBtn).toBeVisible({ timeout: 5000 });

    // Verify the red badge shows "4"
    const badgeText = bellBtn.getByText('4');
    await expect(badgeText).toBeVisible();

    // Take screenshot of navbar with 4-count badge
    await page.screenshot({ path: 'e2e/screenshots/navbar_bell_badge_4.png' });

    // Tap Bell Icon -> Navigate to Notifications screen
    await bellBtn.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 5000 });

    // All 4 notifications should be rendered
    await expect(page.getByText('Team Invitation')).toBeVisible();
    await expect(page.getByText('Cab Seat Request')).toBeVisible();
    await expect(page.getByText('Team Application')).toBeVisible();
    await expect(page.getByText('New Message')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/notifications_screen_4_items.png' });

    // Click "Mark all read"
    const markAllBtn = page.getByText('Mark all read');
    await expect(markAllBtn).toBeVisible();
    await markAllBtn.click();

    // Wait for unread count to become 0 and mark all read button to disappear
    await expect(markAllBtn).not.toBeVisible();

    // Go back to main screen
    const backBtn = page.getByText('← Back').first();
    await backBtn.click();
    await expect(brand).toBeVisible();

    // The badge with "4" should no longer be visible because count is 0!
    await expect(bellBtn.getByText('4')).not.toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/navbar_bell_after_read.png' });
  });
});
