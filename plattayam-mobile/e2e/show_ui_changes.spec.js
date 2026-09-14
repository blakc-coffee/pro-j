const { test, expect } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/dharu/.gemini/antigravity/brain/668aaf9d-4336-47e3-9a45-245cec9a7ef2';

function createTestJwt(expSecondsFromNow = 90 * 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '1', exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })).toString('base64url');
  return `${header}.${payload}.mockSignature123`;
}

test.describe('Demonstrate UI Changes via Playwright', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 14 style)
    await page.setViewportSize({ width: 390, height: 844 });

    // Mock API routes
    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) });
    });

    await page.route('**/notifications', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unread_count: 3,
          notifications: [
            { id: 1, title: 'Cab Joined', message: 'User requested to join cab', type: 'cab_request', is_read: false, created_at: new Date().toISOString() },
            { id: 2, title: 'Team Invite', message: 'Invited to hackathon team', type: 'hack_invite', is_read: false, created_at: new Date().toISOString() },
          ],
        }),
      });
    });

    const mockProfile = {
      user_id: 1,
      id: 1,
      roll_no: '2023110005',
      name: 'Dharun Karthikeyan',
      full_name: '2023110005 DHARUN KARTHIKEYAN S',
      email_id: 'dharun23bcs@iiitkottayam.ac.in',
      phone_no: '9876543210',
      gender: 'M',
    };

    await page.route('**/users/1', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) });
    });

    await page.route('**/users/me', async (route) => {
      if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        Object.assign(mockProfile, body);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockProfile) });
      }
    });

    await page.route('**/users/me/cab-queries', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/users/me/cab-requests', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/cab-queries**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Lost & found items
    const mockItem = {
      id: 10,
      user_id: 1,
      userId: 1,
      title: 'Sony Wireless Headphones',
      category: 'Electronics',
      type: 'lost',
      item_type: 'lost',
      description: 'Black over-ear headphones left near library 2nd floor.',
      location: 'Central Library 2nd Floor',
      location_lost_found: 'Central Library 2nd Floor',
      contact_info: '+91 9876543210',
      status: 'open',
      created_at: new Date().toISOString(),
      user_name: 'Dharun Karthikeyan',
      userName: 'Dharun Karthikeyan',
      primary_image_url: null,
      messages: [],
    };

    await page.route(/\/lost-found\/items/, async (route) => {
      const url = route.request().url();
      if (url.includes('/messages')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/lost-found/items/10')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockItem) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockItem]) });
      }
    });

    // Team mock
    const mockTeam = {
      id: 20,
      name: 'Neural Hackers',
      team_name: 'Neural Hackers',
      teamName: 'Neural Hackers',
      hackathon: 'Smart India Hackathon 2026',
      hackathon_name: 'Smart India Hackathon 2026',
      problem_statement: 'AI Disaster Response & Autonomous Logistics Coordination',
      leader_id: 1,
      leaderId: 1,
      leader_name: 'Dharun Karthikeyan',
      leaderName: 'Dharun Karthikeyan',
      leader_contact: '9876543210',
      contact: '9876543210',
      skills: ['Python', 'FastAPI', 'React Native'],
      techStack: 'PyTorch, Expo, Node.js',
      created_at: new Date().toISOString(),
      members: [
        { id: 1, name: 'Dharun Karthikeyan', role: 'Team Lead' },
        { id: 2, name: 'Aditya Sharma', role: 'ML Engineer' },
        { id: 3, name: 'Rohan Verma', role: 'Frontend Developer' },
      ],
      requests: [],
    };

    await page.route(/\/hackfind\/teams/, async (route) => {
      const url = route.request().url();
      if (url.includes('/requests')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/hackfind/teams/20')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeam) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockTeam]) });
      }
    });

    await page.route('**/hackfind/people**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/hackfind/users/me/teams', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leading_teams: [mockTeam], member_teams: [] }) });
    });

    // Pre-set Light theme and user session
    await page.addInitScript(() => {
      window.localStorage.setItem('plattayam.theme', 'light');
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: 'mock-test-jwt-token',
          user_id: 1,
          name: 'Dharun Karthikeyan',
          full_name: '2023110005 DHARUN KARTHIKEYAN S',
          roll_no: '2023110005',
          email_id: 'dharun23bcs@iiitkottayam.ac.in',
        })
      );
    });
  });

  test('captures all UI changes requested', async ({ page }) => {
    test.setTimeout(45000);

    // 1. Home / Cabs page with top navbar
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Capture 1: Top Navbar with darkened bell icon in Light Mode
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_1_navbar_bell.png'),
      clip: { x: 0, y: 0, width: 390, height: 160 },
    });

    // 2. Open Profile Screen
    const avatarBtn = page.getByLabel('User profile').first();
    await avatarBtn.click();
    await page.waitForTimeout(1000);

    // Capture 2: Profile View Mode (Single display name, no record name text)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_2_profile_view.png'),
    });

    // 3. Click "Customize" on Display Name
    const customizeBtn = page.getByRole('button', { name: /Customize display name/i });
    await customizeBtn.click();
    await page.waitForTimeout(600);

    // Capture 3: Profile Customize Mode (Square 8px buttons, NO ticks, record name text)
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_3_profile_customize.png'),
    });

    // Close-up of just the name buttons & record text
    const nameSection = page.getByText('Display Name').first();
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_3_name_buttons_closeup.png'),
      clip: { x: 20, y: 140, width: 350, height: 260 },
    });

    // Back to MainTabs
    await page.getByRole('button', { name: 'Go back' }).click();
    await page.waitForTimeout(600);

    // 4. Navigate to Lost & Found -> Item Details
    const lostTab = page.getByRole('tab', { name: /Lost & Found/i });
    await lostTab.click();
    await page.waitForTimeout(1000);

    const itemCard = page.getByText('Sony Wireless Headphones').first();
    await itemCard.click();
    await page.waitForTimeout(1000);

    // Scroll to Delete Listing button so the entire Listing Management section is in view
    const deleteListingBtn = page.getByText('Delete Listing');
    await deleteListingBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Capture 4: Listing Management (Owner) - "Delete Listing" without red border or pink box
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_4_listing_management.png'),
    });

    // Back to MainTabs
    await page.getByRole('button', { name: 'Go back' }).click();
    await page.waitForTimeout(600);

    // 5. Navigate to HackMate -> Team Details
    const hackTab = page.getByRole('tab', { name: /HackMate/i });
    await hackTab.click();
    await page.waitForTimeout(1000);

    const viewTeamBtn = page.getByRole('button', { name: 'View Team' }).first();
    await viewTeamBtn.click();
    await page.waitForTimeout(1000);

    // Scroll to Delete Team / Current Members
    const deleteTeamBtn = page.getByText('Delete Team');
    await deleteTeamBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Capture 5: Team Details with Member Remove button and Delete Team outline button
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_5_team_details.png'),
    });

    // Close-up of Current Members and Remove buttons
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'ui_fresh_5_remove_buttons_closeup.png'),
      clip: { x: 20, y: 270, width: 350, height: 250 },
    });
  });
});
