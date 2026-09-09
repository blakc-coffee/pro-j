const { test, expect } = require('@playwright/test');

test.describe('100% UI Theme Verification Across All Pages', () => {
  let uncaughtErrors = [];

  test.beforeEach(async ({ page }) => {
    uncaughtErrors = [];
    page.on('pageerror', (err) => {
      console.error('[Page Error]:', err.message);
      uncaughtErrors.push(err.message);
    });

    // Mock backend endpoints
    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    });

    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token',
          user_id: 1,
          name: 'Dharun Kumar',
          roll_no: '2021001',
          email_id: 'dharun@iiitkottayam.ac.in',
        }),
      });
    });

    await page.route('**/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unread_count: 2,
          notifications: [
            { id: 1, title: 'Cab Joined', message: 'User requested to join cab', type: 'cab_request', is_read: false, created_at: new Date().toISOString() },
            { id: 2, title: 'Team Invite', message: 'Invited to hackathon team', type: 'hack_invite', is_read: false, created_at: new Date().toISOString() },
          ],
        }),
      });
    });

    await page.route('**/cab-queries**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            user_id: 2,
            source: 'Campus Gate',
            destination: 'Kottayam Railway Station',
            departure_datetime: new Date(Date.now() + 86400000).toISOString(),
            seats_available: 3,
            total_seats: 4,
            status: 'OPEN',
            user_name: 'Alex Johnson',
            requests: [],
          },
        ]),
      });
    });

    await page.route('**/lost-found/items**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 10,
            title: 'Blue Water Bottle',
            item_type: 'FOUND',
            category: 'Personal Item',
            description: 'Found near cafeteria tables',
            status: 'OPEN',
            created_at: new Date().toISOString(),
            primary_image_url: null,
            location_lost_found: 'Cafeteria',
            user_id: 1,
          },
        ]),
      });
    });

    await page.route('**/hackfind/teams**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 20,
            hackathon_name: 'Smart India Hackathon',
            team_name: 'CyberHawks',
            description: 'Building AI emergency dispatch system',
            looking_for_roles: ['Frontend Developer', 'ML Engineer'],
            leader_id: 1,
            created_at: new Date().toISOString(),
            members: [],
          },
        ]),
      });
    });

    await page.route('**/hackfind/people**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 30,
            name: 'Sarah Chen',
            role_speciality: 'Full Stack',
            bio: 'React and FastAPI enthusiast looking for a team',
            skills: ['React', 'Python'],
          },
        ]),
      });
    });

    await page.route('**/hackfind/users/me/teams', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          roll_no: '2021001',
          name: 'Dharun Kumar',
          email_id: 'dharun@iiitkottayam.ac.in',
        }),
      });
    });
  });

  test('verifies all screens respond to theme toggling between Light and Dark', async ({ page }) => {
    test.setTimeout(60000);

    // -------------------------------------------------------------
    // STEP 1: Login & Verify Initial Light Theme
    // -------------------------------------------------------------
    await page.goto('/');

    const usernameInput = page.getByPlaceholder(/roll number/i).or(page.getByLabel(/username|roll/i)).or(page.locator('input').first());
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await usernameInput.fill('2021001');
    await passwordInput.fill('keyan@NHA04');
    await page.getByText(/sign in/i).first().click();

    const brand = page.getByText('Plattayam').first();
    await expect(brand).toBeVisible({ timeout: 8000 });

    // Verify Light Mode initial attributes
    const themeInitial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeInitial).toBe('light');

    // Screenshot 1: Cabs (Light)
    await page.screenshot({ path: 'e2e/screenshots/1_cabs_light.png' });

    // Screenshot 2: Lost & Found (Light)
    const lostTab = page.getByText('Lost & Found').first();
    await lostTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByText(/report item/i).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/2_lostfound_light.png' });

    // Screenshot 3: HackMate (Light)
    const hackTab = page.getByText('HackMate').first();
    await hackTab.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByText(/Teams/i).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/3_hackmate_light.png' });

    // Back to Cabs before opening top nav
    const cabsTab = page.getByText('Cabs').first();
    await cabsTab.click({ force: true });
    await page.waitForTimeout(300);

    // Screenshot 4: Notifications (Light)
    const bellBtn = page.getByLabel(/Notifications/i).first();
    await bellBtn.click({ force: true });
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/4_notifications_light.png' });
    await page.getByText('← Back').first().click({ force: true });
    await expect(brand).toBeVisible({ timeout: 5000 });

    // Screenshot 5: Profile (Light)
    const profileBtn = page.getByLabel(/Profile/i).first();
    await profileBtn.click({ force: true });
    await expect(page.getByText('Profile', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/5_profile_light.png' });

    // -------------------------------------------------------------
    // STEP 2: Toggle to DARK MODE
    // -------------------------------------------------------------
    const themeToggleBtn = page.getByLabel(/Theme switch/i).first();
    await themeToggleBtn.click({ force: true });
    await expect(page.getByText('Appearance').first()).toBeVisible();

    const darkOption = page.getByText('Dark', { exact: true }).first();
    await darkOption.click({ force: true });
    await page.waitForTimeout(400);

    // Verify dark attributes applied to DOM
    const themeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeDark).toBe('dark');

    const darkBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    // Dark theme background is pure black: rgb(0, 0, 0)
    expect(darkBg).toBe('rgb(0, 0, 0)');

    // Screenshot 6: Profile (Dark)
    await page.screenshot({ path: 'e2e/screenshots/6_profile_dark.png' });

    // -------------------------------------------------------------
    // STEP 3: Verify all other pages in DARK MODE
    // -------------------------------------------------------------
    // Back to MainTabs
    await page.getByText('← Back').first().click({ force: true });
    await expect(brand).toBeVisible({ timeout: 5000 });

    // Screenshot 7: Cabs (Dark)
    await cabsTab.click({ force: true });
    await page.waitForTimeout(300);

    // Verify body background is dark on Cabs screen
    const cabsBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(cabsBg).toBe('rgb(0, 0, 0)');
    await page.screenshot({ path: 'e2e/screenshots/7_cabs_dark.png' });

    // Screenshot 8: Lost & Found (Dark)
    await lostTab.click({ force: true });
    await page.waitForTimeout(300);
    const lostBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(lostBg).toBe('rgb(0, 0, 0)');
    await page.screenshot({ path: 'e2e/screenshots/8_lostfound_dark.png' });

    // Screenshot 9: HackMate (Dark)
    await hackTab.click({ force: true });
    await page.waitForTimeout(300);
    const hackBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(hackBg).toBe('rgb(0, 0, 0)');
    await page.screenshot({ path: 'e2e/screenshots/9_hackmate_dark.png' });

    // Back to Cabs for Notifications and Post Ride
    await cabsTab.click({ force: true });
    await page.waitForTimeout(300);

    // Screenshot 10: Notifications (Dark)
    await bellBtn.click({ force: true });
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 5000 });
    const notifBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(notifBg).toBe('rgb(0, 0, 0)');
    await page.screenshot({ path: 'e2e/screenshots/10_notifications_dark.png' });
    await page.getByText('← Back').first().click({ force: true });
    await expect(brand).toBeVisible({ timeout: 5000 });

    // Screenshot 11: Post Ride (Dark)
    const postRideBtn = page.getByText('Post Ride', { exact: true }).first();
    if (await postRideBtn.isVisible()) {
      await postRideBtn.click({ force: true });
      await expect(page.getByText('Post a Ride', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      const postRideBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
      expect(postRideBg).toBe('rgb(0, 0, 0)');
      await page.screenshot({ path: 'e2e/screenshots/11_postride_dark.png' });
      await page.getByText('← Back').first().click({ force: true });
      await expect(brand).toBeVisible({ timeout: 5000 });
    }

    // -------------------------------------------------------------
    // STEP 4: Toggle Back to LIGHT MODE
    // -------------------------------------------------------------
    await profileBtn.click({ force: true });
    await expect(page.getByText('Profile', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    const themeToggleBtn2 = page.getByLabel(/Theme switch/i).first();
    await themeToggleBtn2.click({ force: true });
    await expect(page.getByText('Appearance').first()).toBeVisible();

    const lightOption = page.getByText('Light', { exact: true }).first();
    await lightOption.click({ force: true });
    await page.waitForTimeout(400);

    const themeReturned = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeReturned).toBe('light');

    const lightBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    // Light theme background: rgb(247, 245, 242) = #f7f5f2
    expect(lightBg).toBe('rgb(247, 245, 242)');

    // Screenshot 12: Profile restored to Light
    await page.screenshot({ path: 'e2e/screenshots/12_profile_restored_light.png' });

    // Back to Cabs
    await page.getByText('← Back').first().click({ force: true });
    await expect(brand).toBeVisible({ timeout: 5000 });

    // Screenshot 13: Cabs restored to Light
    await page.screenshot({ path: 'e2e/screenshots/13_cabs_restored_light.png' });

    // -------------------------------------------------------------
    // CRITICAL ASSERTION: Zero uncaught runtime exceptions / TypeErrors
    // -------------------------------------------------------------
    expect(uncaughtErrors).toEqual([]);
  });
});
