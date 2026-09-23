const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GALLERY_DIR = 'C:/Users/dharu/.gemini/antigravity/brain/668aaf9d-4336-47e3-9a45-245cec9a7ef2/gallery';
fs.mkdirSync(GALLERY_DIR, { recursive: true });

function createTestJwt(userId = '1', expSecondsFromNow = 90 * 86400) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: String(userId), exp: Math.floor(Date.now() / 1000) + expSecondsFromNow })
  ).toString('base64url');
  return `${header}.${payload}.mockSignature123`;
}

const mockTeam = {
  id: '10',
  name: 'CyberHawks AI',
  hackathon: 'Smart India Hackathon 2026',
  leaderId: '1',
  leaderName: 'Dharun S',
  problemStatement: 'Automated Emergency Dispatch System',
  description: 'Building AI-driven automated emergency triage and dispatch mobile platform.',
  skills: ['React Native', 'FastAPI', 'Python'],
  techStack: ['Expo', 'PyTorch', 'PostgreSQL'],
  maxMembers: 4,
  members: [
    { id: '1', name: 'Dharun S', role: 'Team Lead' },
    { id: '2', name: 'Ananya Sharma', role: 'ML Engineer' },
  ],
  status: 'looking_for_members',
  contact: 'dharun@iiitkottayam.ac.in',
};

const mockRequests = [
  {
    id: '101',
    teamId: '10',
    userId: '4',
    name: 'Rohit Verma',
    rollNo: '2023110004',
    role: 'Frontend Developer',
    skills: ['React Native', 'TypeScript', 'Tailwind'],
    notes: 'Excited to build the mobile dispatch UI and real-time alerts!',
    type: 'request',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockApplicantProfile = {
  id: '4',
  userId: '4',
  name: 'Rohit Verma',
  rollNo: '2023110004',
  role: 'Frontend Developer',
  skills: ['React Native', 'TypeScript', 'Tailwind', 'Figma'],
  techStack: ['Expo', 'Redux', 'GraphQL'],
  experience: '2 years building React Native and Web apps',
  about: 'Passionate frontend engineer focused on high-performance mobile interfaces and design systems.',
  portfolio: 'https://github.com/rohitverma',
  contact: 'rohit@iiitkottayam.ac.in',
  hackathon: 'Smart India Hackathon 2026',
  status: 'open',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
};

const mockNotifications = [
  {
    id: 501,
    title: 'Team Join Request',
    message: 'Rohit Verma requested to join your team CyberHawks AI',
    type: 'hack_request',
    reference_id: '10',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

async function setupLeaderRoutes(page) {
  await page.route(/\/notifications(?:\?|\/|$)/, async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unread_count: 1, notifications: mockNotifications }),
      });
    }
  });

  await page.route(/\/hackfind\/teams\/10\/requests/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRequests),
    });
  });

  await page.route(/\/hackfind\/teams\/10(?:\?|$)/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTeam),
    });
  });

  await page.route(/\/hackfind\/people\//, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApplicantProfile),
    });
  });

  await page.route(/\/hackfind\/users\/me\/profile/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: '1', role: 'Team Lead', skills: ['FastAPI'] }),
    });
  });

  await page.route(/\/hackfind\/users\/me\/teams/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ leading: [mockTeam], memberOf: [], pendingInvitations: [] }),
    });
  });
}

test.describe('HackMate Requests & Profile Flow', () => {
  test('1. Leader clicks applicant card directly to view Candidate Profile (no button) - Light Mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupLeaderRoutes(page);

    await page.addInitScript((token) => {
      window.localStorage.setItem('plattayam.theme', 'light');
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: token,
          user_id: 1,
          name: 'Dharun S',
          roll_no: '2023110005',
          email_id: 'dharun@iiitkottayam.ac.in',
        })
      );
    }, createTestJwt('1'));

    await page.goto('/');

    const bellBtn = page.getByLabel(/Notifications/i).first();
    await bellBtn.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 6000 });
    await page.getByText('Team Join Request').click();
    await expect(page.getByText('Pending Join Requests (1)')).toBeVisible({ timeout: 6000 });

    const reqLink = page.getByTestId('request-profile-link');
    await reqLink.scrollIntoViewIfNeeded();
    await expect(reqLink).toBeVisible();
    await expect(reqLink).toContainText('Rohit Verma');
    await expect(reqLink).toContainText('2023110004');
    await expect(page.getByText('Frontend Developer').first()).toBeVisible();

    // Verify there is NO separate "View Profile →" button or badge
    await expect(page.getByText('View Profile →')).not.toBeVisible();

    // Screenshot Team Details with direct clickable card (no extra button)
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '01_leader_view_team_requests.png'), fullPage: true });

    // Click directly on the applicant card
    await reqLink.click();

    // Verify CandidateProfileScreen opened
    await expect(page.getByText('Candidate Profile')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('2 years building React Native and Web apps')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Passionate frontend engineer focused on high-performance')).toBeVisible();
    await expect(page.getByText('rohit@iiitkottayam.ac.in', { exact: true })).toBeVisible();

    // Screenshot Candidate Profile
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '02_candidate_profile_from_request.png'), fullPage: true });
  });

  test('2. Leader clicks applicant card directly to view Candidate Profile (no button) - Dark Mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupLeaderRoutes(page);

    await page.addInitScript((token) => {
      window.localStorage.setItem('plattayam.theme', 'dark');
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: token,
          user_id: 1,
          name: 'Dharun S',
          roll_no: '2023110005',
          email_id: 'dharun@iiitkottayam.ac.in',
        })
      );
    }, createTestJwt('1'));

    await page.goto('/');

    const bellBtn = page.getByLabel(/Notifications/i).first();
    await bellBtn.click();
    await expect(page.getByText('Notifications')).toBeVisible({ timeout: 6000 });
    await page.getByText('Team Join Request').click();
    await expect(page.getByText('Pending Join Requests (1)')).toBeVisible({ timeout: 6000 });

    const reqLink = page.getByTestId('request-profile-link');
    await reqLink.scrollIntoViewIfNeeded();
    await expect(reqLink).toBeVisible();
    await expect(page.getByText('View Profile →')).not.toBeVisible();

    // Screenshot in Dark Mode
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '01_leader_view_team_requests_dark.png'), fullPage: true });

    // Click directly on applicant card
    await reqLink.click();
    await expect(page.getByText('Candidate Profile')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('2 years building React Native and Web apps')).toBeVisible({ timeout: 6000 });

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '02_candidate_profile_from_request_dark.png'), fullPage: true });
  });

  test('3. Candidate without profile sees gate, navigates to Create Profile Card (no green tick) - Light Mode', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const mockQuantumTeam = {
      id: '20',
      name: 'Quantum Devs',
      hackathon: 'InOut 2026',
      leaderId: '5',
      leaderName: 'Sneha Menon',
      problemStatement: 'Distributed consensus algorithm',
      description: 'Research and development of distributed ledger tech.',
      skills: ['Rust', 'Go'],
      techStack: ['Wasm', 'Docker'],
      maxMembers: 3,
      members: [{ id: '5', name: 'Sneha Menon', role: 'Lead' }],
      status: 'looking_for_members',
      contact: 'sneha@iiitkottayam.ac.in',
    };

    await page.route(/\/hackfind\/users\/me\/profile/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });

    await page.route(/\/hackfind\/teams\/20(?:\?|$)/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockQuantumTeam) });
    });

    await page.route(/\/hackfind\/teams(?:\?|$)/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockQuantumTeam]) });
    });

    await page.route(/\/notifications/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unread_count: 0, notifications: [] }) });
    });

    await page.addInitScript((token) => {
      window.localStorage.setItem('plattayam.theme', 'light');
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: token,
          user_id: 99,
          name: 'New Candidate',
          roll_no: '2023110099',
          email_id: 'user99@iiitkottayam.ac.in',
        })
      );
    }, createTestJwt('99'));

    await page.goto('/');

    const hackmateTab = page.getByRole('tab', { name: /HackMate/i });
    await hackmateTab.click();

    const viewTeamBtn = page.getByRole('button', { name: /View team Quantum Devs/i });
    await expect(viewTeamBtn).toBeVisible({ timeout: 6000 });
    await viewTeamBtn.click();

    const profilePrompt = page.getByText('You need to create your HackMate candidate profile before requesting to join teams.');
    await profilePrompt.scrollIntoViewIfNeeded();
    await expect(profilePrompt).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Create Profile to Apply')).toBeVisible();

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '03_candidate_no_profile_gate.png'), fullPage: true });

    // Click "Create Profile to Apply"
    await page.getByText('Create Profile to Apply').click();

    // Verify navigation to Create Profile screen
    await expect(page.getByText('Create Profile Card')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('PROFESSIONAL INFO')).toBeVisible();
    await expect(page.getByText('Open to Work')).toBeVisible();

    // Verify that NO checkmark tick '✓' is rendered
    await expect(page.getByText('✓')).not.toBeVisible();

    // Screenshot Create Profile screen without green ticks
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '04_navigated_to_create_profile.png'), fullPage: true });
  });

  test('4. Create Profile Card in Dark Mode (no green tick)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const mockQuantumTeam = {
      id: '20',
      name: 'Quantum Devs',
      hackathon: 'InOut 2026',
      leaderId: '5',
      leaderName: 'Sneha Menon',
      maxMembers: 3,
      members: [{ id: '5', name: 'Sneha Menon', role: 'Lead' }],
      status: 'looking_for_members',
      contact: 'sneha@iiitkottayam.ac.in',
    };

    await page.route(/\/hackfind\/users\/me\/profile/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });

    await page.route(/\/hackfind\/teams\/20(?:\?|$)/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockQuantumTeam) });
    });

    await page.route(/\/hackfind\/teams(?:\?|$)/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockQuantumTeam]) });
    });

    await page.route(/\/notifications/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unread_count: 0, notifications: [] }) });
    });

    await page.addInitScript((token) => {
      window.localStorage.setItem('plattayam.theme', 'dark');
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          access_token: token,
          user_id: 99,
          name: 'New Candidate',
          roll_no: '2023110099',
          email_id: 'user99@iiitkottayam.ac.in',
        })
      );
    }, createTestJwt('99'));

    await page.goto('/');

    const hackmateTab = page.getByRole('tab', { name: /HackMate/i });
    await hackmateTab.click();

    const viewTeamBtn = page.getByRole('button', { name: /View team Quantum Devs/i });
    await expect(viewTeamBtn).toBeVisible({ timeout: 6000 });
    await viewTeamBtn.click();

    await page.getByText('Create Profile to Apply').click();

    await expect(page.getByText('Create Profile Card')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('Open to Work')).toBeVisible();
    await expect(page.getByText('✓')).not.toBeVisible();

    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(GALLERY_DIR, '04_navigated_to_create_profile_dark.png'), fullPage: true });
  });
});
