const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Plattayam Routes and Theme Verification', () => {
  let uncaughtErrors = [];

  test.beforeEach(async ({ page }) => {
    uncaughtErrors = [];
    page.on('pageerror', (err) => {
      console.error('Captured pageerror:', err.message);
      uncaughtErrors.push(err.message);
    });

    // Mock API routes to isolate frontend UI verification
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

  test('executes complete end-to-end user journey across all tabs, screens, and themes with zero crashes', async ({ page }) => {
    // 1. Initial Load - Login Screen
    await page.goto('/');

    // Check Login screen UI
    const usernameInput = page.getByPlaceholder(/roll number/i).or(page.getByLabel(/username|roll/i)).or(page.locator('input').first());
    await expect(usernameInput).toBeVisible({ timeout: 10000 });

    const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
    await expect(passwordInput).toBeVisible();

    // Fill credentials and click Sign In
    await usernameInput.fill('2021001');
    await passwordInput.fill('keyan@NHA04');

    const signInBtn = page.getByText(/sign in/i).first();
    await signInBtn.click();

    // 2. Main Tabs - Verify Cabs Screen (First tab)
    // The AppNavBar should appear
    const brand = page.getByText('Plattayam').first();
    await expect(brand).toBeVisible({ timeout: 8000 });

    // Verify all 3 bottom tabs are visible and rendered without BottomTabItem crash
    const cabsTab = page.getByText('Cabs').first();
    const lostFoundTab = page.getByText('Lost & Found').first();
    const hackmateTab = page.getByText('HackMate').first();

    await expect(cabsTab).toBeVisible();
    await expect(lostFoundTab).toBeVisible();
    await expect(hackmateTab).toBeVisible();

    // Take screenshot of home screen with tabs rendered
    await page.screenshot({ path: 'e2e/screenshots/tab_bar_cabs.png' });

    // 3. Switch to Lost & Found Tab
    await lostFoundTab.click();
    await page.waitForTimeout(500);

    // Verify Lost & Found content
    const reportItemBtn = page.getByText(/report item/i).first();
    await expect(reportItemBtn).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/tab_bar_lostfound.png' });

    // 4. Switch to HackMate Tab
    await hackmateTab.click();
    await page.waitForTimeout(500);

    // Verify HackMate content
    const teamsHeader = page.getByText(/HackMate|Teams|CyberHawks/i).first();
    await expect(teamsHeader).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/tab_bar_hackmate.png' });

    // Switch back to Cabs
    await cabsTab.click();
    await page.waitForTimeout(300);

    // 5. AppNavBar -> Notifications Screen
    const bellBtn = page.getByLabel(/Notifications/i).first();
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'e2e/screenshots/route_notifications.png' });

    // Back to Cabs
    const backFromNotif = page.getByText('← Back').first();
    await backFromNotif.click();
    await expect(brand).toBeVisible({ timeout: 5000 });

    // 6. AppNavBar -> Profile Screen
    const profileBtn = page.getByLabel(/Profile/i).first();
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Verify Profile Screen rendered
    await expect(page.getByText('Profile', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Dharun Kumar').first()).toBeVisible();

    // 7. Direct Theme Toggle on Profile Screen (No modal, instant toggle)
    const themeToggleBtn = page.getByLabel(/Theme switch/i).first();
    await expect(themeToggleBtn).toBeVisible();
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    // Verify Dark Mode attributes applied
    const dataThemeDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataThemeDark).toBe('dark');
    await page.screenshot({ path: 'e2e/screenshots/route_profile_dark.png' });

    // Switch back to Light Mode with one click
    await themeToggleBtn.click();
    await page.waitForTimeout(300);

    const dataThemeLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataThemeLight).toBe('light');

    // Back to Main
    const backFromProfile = page.getByText('← Back').first();
    await backFromProfile.click();
    await expect(brand).toBeVisible({ timeout: 5000 });

    // 8. Navigate to Post Ride Screen
    const postRideBtn = page.getByText(/Post a Ride|\+ Post Ride/i).first();
    if (await postRideBtn.isVisible()) {
      await postRideBtn.click();
      await expect(page.getByText(/Post a Cab Query|Post Ride/i).first()).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'e2e/screenshots/route_post_ride.png' });

      const backFromPostRide = page.getByText('← Back').or(page.getByText(/Cancel/i)).first();
      await backFromPostRide.click();
      await expect(brand).toBeVisible({ timeout: 5000 });
    }

    // 9. CRITICAL ASSERTION: Zero uncaught runtime exceptions / TypeError
    expect(uncaughtErrors).toEqual([]);
  });
});
