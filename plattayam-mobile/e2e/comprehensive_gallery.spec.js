const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const GALLERY_DIR = 'C:/Users/dharu/.gemini/antigravity/brain/668aaf9d-4336-47e3-9a45-245cec9a7ef2/gallery';
fs.mkdirSync(GALLERY_DIR, { recursive: true });

function setupMocks(page) {
  return Promise.all([
    page.route('**/health', async (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) })
    ),

    page.route('**/notifications', async (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          unread_count: 2,
          notifications: [
            {
              id: 1,
              title: 'Cab Joined',
              message: 'Aditya Sharma requested to join your Kottayam Station cab',
              type: 'cab_request',
              ref_id: 101,
              is_read: false,
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Team Invite',
              message: 'Invited to join Smart India Hackathon 2026 team',
              type: 'hack_invite',
              ref_id: 20,
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
    ),

    page.route('**/users/1', async (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          user_id: 1,
          roll_no: '2023110005',
          name: 'Dharun Karthikeyan',
          full_name: '2023110005 DHARUN KARTHIKEYAN S',
          email_id: 'dharun23bcs@iiitkottayam.ac.in',
          phone_no: '+91 9876543210',
          gender: 'M',
        }),
      })
    ),

    page.route('**/users/2', async (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          user_id: 2,
          roll_no: '2023110042',
          name: 'Aditya Sharma',
          full_name: '2023110042 ADITYA SHARMA',
          email_id: 'aditya23bcs@iiitkottayam.ac.in',
          phone_no: '+91 9123456780',
          gender: 'M',
        }),
      })
    ),

    page.route('**/users/me', async (r) => {
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          user_id: 1,
          roll_no: '2023110005',
          name: 'Dharun Karthikeyan',
          full_name: '2023110005 DHARUN KARTHIKEYAN S',
          email_id: 'dharun23bcs@iiitkottayam.ac.in',
          phone_no: '+91 9876543210',
        }),
      });
    }),

    page.route(/\/(cab-queries|cab-requests)/, async (r) => {
      const url = r.request().url();
      if (url.includes('/users/me/cab-queries')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              cab_id: 101,
              user_id: 1,
              user_name: 'Dharun Karthikeyan',
              from_loc: 'Campus Gate 1',
              to_loc: 'Kottayam Railway Station',
              date: '2026-09-15',
              travel_date: '2026-09-15',
              time: '14:30:00',
              dep_time: '14:30:00',
              seats_avbl: 2,
              notes: 'Leaving on time for afternoon train. Split fare equally.',
              status: 'open',
              created_at: new Date().toISOString(),
            },
          ]),
        });
      } else if (url.includes('/users/me/cab-requests')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 501,
              query_id: 102,
              user_id: 1,
              status: 'pending',
              from_loc: 'Kochi Airport (COK)',
              to_loc: 'Campus Gate 1',
              date: '2026-09-18',
              time: '18:00:00',
              driver_name: 'Rohan Verma',
            },
          ]),
        });
      } else if (url.includes('/requests')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 301,
              user_id: 2,
              user_name: 'Aditya Sharma',
              phone: '+91 9123456780',
              status: 'pending',
              seats_requested: 1,
            },
          ]),
        });
      } else if (url.includes('/cab-queries/101')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 101,
            cab_id: 101,
            user_id: 1,
            creator_id: 1,
            user_name: 'Dharun Karthikeyan',
            creator_name: 'Dharun Karthikeyan',
            from_loc: 'Campus Gate 1',
            to_loc: 'Kottayam Railway Station',
            date: '2026-09-15',
            travel_date: '2026-09-15',
            time: '14:30:00',
            dep_time: '14:30:00',
            seats_avbl: 2,
            notes: 'Leaving on time for afternoon train. Split fare equally.',
            status: 'open',
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              cab_id: 101,
              user_id: 1,
              user_name: 'Dharun Karthikeyan',
              from_loc: 'Campus Gate 1',
              to_loc: 'Kottayam Railway Station',
              date: '2026-09-15',
              travel_date: '2026-09-15',
              time: '14:30:00',
              dep_time: '14:30:00',
              seats_avbl: 2,
              notes: 'Leaving on time for afternoon train.',
              status: 'open',
              created_at: new Date().toISOString(),
            },
          ]),
        });
      }
    }),

    page.route(/\/lost-found/, async (r) => {
      const url = r.request().url();
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
      if (url.includes('/messages')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      } else if (url.includes('/users/me/items')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockItem]) });
      } else if (url.includes('/lost-found/items/10')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockItem) });
      } else {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockItem]) });
      }
    }),

    page.route(/\/hackfind/, async (r) => {
      const url = r.request().url();
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
        leader_contact: '+91 9876543210',
        contact: '+91 9876543210',
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

      const mockPerson = {
        id: 2,
        user_id: 2,
        name: 'Aditya Sharma',
        role: 'ML Engineer / Python Backend',
        hackathon: 'Smart India Hackathon 2026',
        skills: ['Python', 'FastAPI', 'PyTorch'],
        tech_stack: ['Docker', 'PyTorch', 'Ray'],
        techStack: 'Docker, PyTorch, Ray',
        status: 'open',
        about: 'Passionate about computer vision and distributed systems.',
        contact: '+91 9123456780',
        experience: 'Built real-time video analytics pipeline for robotics.',
      };

      if (url.includes('/teams/20/requests')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 901,
              user_id: 2,
              applicant_id: 2,
              user_name: 'Aditya Sharma',
              applicant_name: 'Aditya Sharma',
              role: 'ML Engineer',
              status: 'pending',
              created_at: new Date().toISOString(),
            },
          ]),
        });
      } else if (url.includes('/users/me/teams')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            leading: [mockTeam],
            joined: [],
            pending: [],
          }),
        });
      } else if (url.includes('/users/me/profile')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            user_id: 1,
            name: 'Dharun Karthikeyan',
            role: 'Full Stack Engineer',
            hackathon: 'Smart India Hackathon 2026',
            skills: ['React Native', 'Node.js', 'FastAPI'],
            tech_stack: ['PostgreSQL', 'Expo', 'Tailwind CSS'],
            techStack: 'PostgreSQL, Expo, Tailwind CSS',
            status: 'open',
            experience: 'Full stack mobile development with Expo and FastAPI.',
            contact: '+91 9876543210',
          }),
        });
      } else if (url.includes('/people/2')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPerson) });
      } else if (url.includes('/people/1')) {
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            user_id: 1,
            name: 'Dharun Karthikeyan',
            role: 'Full Stack Engineer',
            hackathon: 'Smart India Hackathon 2026',
            skills: ['React Native', 'Node.js', 'FastAPI'],
            tech_stack: ['PostgreSQL', 'Expo', 'Tailwind CSS'],
            techStack: 'PostgreSQL, Expo, Tailwind CSS',
            status: 'open',
            contact: '+91 9876543210',
          }),
        });
      } else if (url.includes('/people')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockPerson]) });
      } else if (url.includes('/teams/20')) {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTeam) });
      } else {
        r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockTeam]) });
      }
    }),
  ]);
}

async function authenticatePage(page, mode) {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMocks(page);
  await page.addInitScript((theme) => {
    window.localStorage.setItem('plattayam.theme', theme);
    window.localStorage.setItem(
      'plattayam.user',
      JSON.stringify({
        access_token: 'mock-jwt-token',
        user_id: 1,
        name: 'Dharun Karthikeyan',
        full_name: '2023110005 DHARUN KARTHIKEYAN S',
        roll_no: '2023110005',
        email_id: 'dharun23bcs@iiitkottayam.ac.in',
        phone_no: '+91 9876543210',
      })
    );
  }, mode);
}

test.describe('1. Login Screen', () => {
  for (const mode of ['light', 'dark']) {
    test(`Login screen in ${mode} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await setupMocks(page);
      await page.addInitScript((theme) => {
        window.localStorage.setItem('plattayam.theme', theme);
      }, mode);

      await page.goto('/');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(GALLERY_DIR, `00_login_${mode}.png`) });
    });
  }
});

test.describe('2. Cabs & Notifications', () => {
  for (const mode of ['light', 'dark']) {
    test(`Cabs and Notifications in ${mode} mode`, async ({ page }) => {
      await authenticatePage(page, mode);

      // Cabs Feed
      await page.goto('/');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(GALLERY_DIR, `01_cabs_feed_${mode}.png`) });

      // Cabs Filter "Open"
      const openChip = page.getByRole('button', { name: 'Open' });
      if (await openChip.isVisible()) {
        await openChip.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(GALLERY_DIR, `02_cabs_filter_open_${mode}.png`) });
      }

      // Post Ride Form
      const postRideBtn = page.getByRole('button', { name: 'Post Ride' });
      await postRideBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `03_post_ride_form_${mode}.png`) });

      // Post Ride Form Filled (with date & departure pickers)
      const fromInput = page.getByPlaceholder(/Campus Gate 1/i);
      if (await fromInput.isVisible()) {
        await fromInput.fill('Campus Gate 1');
        const toInput = page.getByPlaceholder(/Kottayam Railway Station/i);
        await toInput.fill('Kottayam Railway Station');
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(GALLERY_DIR, `03b_post_ride_filled_${mode}.png`) });
      }
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);

      // Ride Details Screen
      const rideCard = page.getByText('Campus Gate 1').first();
      await rideCard.click();
      await page.waitForSelector('text=Leaving on time', { timeout: 5000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(GALLERY_DIR, `04_ride_details_${mode}.png`) });

      // Rider Profile Modal / Dialog Box
      const riderRow = page.getByText('Aditya Sharma').first();
      if (await riderRow.isVisible()) {
        await riderRow.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(GALLERY_DIR, `05_rider_modal_${mode}.png`) });

        const closeProfileBtn = page.getByLabel('Close profile dialog');
        if (await closeProfileBtn.isVisible()) {
          await closeProfileBtn.click();
        } else {
          const backdrop = page.getByLabel('Dismiss modal backdrop');
          if (await backdrop.isVisible()) await backdrop.click();
        }
        await page.waitForTimeout(400);
      }
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);

      // Notifications Screen
      const notifBell = page.getByLabel(/notifications/i).first();
      await notifBell.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `06_notifications_${mode}.png`) });
    });
  }
});

test.describe('3. Profile & Settings', () => {
  for (const mode of ['light', 'dark']) {
    test(`Profile and settings in ${mode} mode`, async ({ page }) => {
      await authenticatePage(page, mode);

      await page.goto('/');
      await page.waitForTimeout(1500);

      // Open Profile
      const profileAvatar = page.getByLabel('User profile').first();
      await profileAvatar.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `07_profile_view_${mode}.png`) });

      // Customize Display Name (Expanded - Record Name & Clean Chips)
      const customizeBtn = page.getByRole('button', { name: /Customize display name/i });
      await customizeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(GALLERY_DIR, `08_profile_customize_${mode}.png`) });

      // Close-up of Name Chips (Verifying NO tick marks)
      await page.screenshot({
        path: path.join(GALLERY_DIR, `09_name_chips_closeup_${mode}.png`),
        clip: { x: 20, y: 150, width: 350, height: 250 },
      });

      const cancelNameBtn = page.getByRole('button', { name: /Cancel/i }).first();
      await cancelNameBtn.click();
      await page.waitForTimeout(400);

      // Edit Phone Mode
      const editPhoneBtn = page.getByRole('button', { name: 'Edit' }).first();
      if (await editPhoneBtn.isVisible()) {
        await editPhoneBtn.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(GALLERY_DIR, `10_profile_edit_phone_${mode}.png`) });
        const cancelPhoneBtn = page.getByRole('button', { name: /Cancel/i }).first();
        if (await cancelPhoneBtn.isVisible()) await cancelPhoneBtn.click();
        await page.waitForTimeout(400);
      }

      // My Rides: Posted Tab
      const manageRidesBtn = page.getByRole('button', { name: 'Manage' }).first();
      if (await manageRidesBtn.isVisible()) {
        await manageRidesBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(GALLERY_DIR, `11_my_rides_posted_${mode}.png`) });

        // My Rides: Requested Tab
        const requestsTab = page.getByRole('tab', { name: /Requests/i });
        if (await requestsTab.isVisible()) {
          await requestsTab.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(GALLERY_DIR, `12_my_rides_requests_${mode}.png`) });
        }
        await page.getByRole('button', { name: 'Go back' }).click();
        await page.waitForTimeout(500);
      }

      // My Items Screen
      const viewItemsBtn = page.getByRole('button', { name: 'View My Items' }).first();
      if (await viewItemsBtn.isVisible()) {
        await viewItemsBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(GALLERY_DIR, `13_my_items_${mode}.png`) });
        await page.getByRole('button', { name: 'Go back' }).click();
        await page.waitForTimeout(500);
      }
    });
  }
});

test.describe('4. Lost & Found', () => {
  for (const mode of ['light', 'dark']) {
    test(`Lost and Found in ${mode} mode`, async ({ page }) => {
      await authenticatePage(page, mode);

      await page.goto('/');
      await page.waitForTimeout(1500);

      // Switch to Lost & Found Tab
      const lostTab = page.getByRole('tab', { name: /Lost & Found/i });
      await lostTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `14_lostfound_feed_${mode}.png`) });

      // Lost & Found Segment Filter: "Lost"
      const lostSegment = page.getByRole('button', { name: 'Lost' }).first();
      if (await lostSegment.isVisible()) {
        await lostSegment.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(GALLERY_DIR, `14b_lostfound_type_lost_${mode}.png`) });
        const allSegment = page.getByRole('button', { name: 'All' }).first();
        if (await allSegment.isVisible()) await allSegment.click();
        await page.waitForTimeout(300);
      }

      // Report Item Screen
      const reportItemBtn = page.getByRole('button', { name: /Report Item/i });
      await reportItemBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `15_report_item_form_${mode}.png`) });

      // Report Item: Click Category Chip (Cards & IDs)
      const cardsChip = page.getByText('Cards & IDs');
      if (await cardsChip.isVisible()) {
        await cardsChip.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(GALLERY_DIR, `15b_report_item_category_selected_${mode}.png`) });
      }
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);

      // Item Details Screen (Owner view showing Delete Listing pure red text)
      const itemCard = page.getByText('Sony Wireless Headphones').first();
      await itemCard.click();
      await page.waitForTimeout(800);
      const deleteListingBtn = page.getByText('Delete Listing');
      await deleteListingBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(GALLERY_DIR, `16_item_details_owner_${mode}.png`) });
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);
    });
  }
});

test.describe('5. HackMate Marketplace & Teams', () => {
  for (const mode of ['light', 'dark']) {
    test(`HackMate and Teams in ${mode} mode`, async ({ page }) => {
      test.setTimeout(60000);
      await authenticatePage(page, mode);

      await page.goto('/');
      await page.waitForTimeout(1500);

      // Switch to HackMate Tab
      const hackTab = page.getByRole('tab', { name: /HackMate/i });
      await hackTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `17_hackmate_teams_${mode}.png`) });

      // Filter Chips: Looking for members
      const lookingFilter = page.getByText('Looking for members');
      if (await lookingFilter.isVisible()) {
        await lookingFilter.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(GALLERY_DIR, `17b_hackmate_teams_filtered_${mode}.png`) });
      }

      // Team Details Screen
      const viewTeamBtn = page.getByRole('button', { name: 'View Team' }).first();
      await viewTeamBtn.click();
      await page.waitForTimeout(800);
      const deleteTeamBtn = page.getByText('Delete Team');
      await deleteTeamBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(GALLERY_DIR, `19_team_details_${mode}.png`) });

      // Close-up of Member "Remove" Pure Red Text
      await page.screenshot({
        path: path.join(GALLERY_DIR, `20_remove_btn_closeup_${mode}.png`),
        clip: { x: 20, y: 280, width: 350, height: 240 },
      });
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);

      // Create Team Form
      const createTeamBtn = page.getByRole('button', { name: /Create a Team/i });
      if (await createTeamBtn.isVisible()) {
        await createTeamBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(GALLERY_DIR, `23_create_team_form_${mode}.png`) });
        await page.getByRole('button', { name: 'Go back' }).click();
        await page.waitForTimeout(500);
      }

      // HackMate: People Tab
      const peopleTab = page.getByRole('button', { name: 'People' });
      await peopleTab.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(GALLERY_DIR, `18_hackmate_people_${mode}.png`) });

      // Candidate Profile Screen (Click View Profile button on PeopleCard)
      const viewProfileBtn = page.getByRole('button', { name: /View Profile/i }).first();
      await viewProfileBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(GALLERY_DIR, `21_candidate_profile_${mode}.png`) });

      // Candidate Invite Modal / Dropdown Dialog Box
      const inviteBtn = page.getByRole('button', { name: /Invite to Team/i });
      if (await inviteBtn.isVisible()) {
        await inviteBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(GALLERY_DIR, `22_candidate_invite_modal_${mode}.png`) });
        const cancelInviteBtn = page.getByRole('button', { name: /Cancel/i }).first();
        if (await cancelInviteBtn.isVisible()) await cancelInviteBtn.click();
        await page.waitForTimeout(300);
      }
      await page.getByRole('button', { name: 'Go back' }).click();
      await page.waitForTimeout(500);

      // Create / Edit Profile Card Screen
      const editProfileBtn = page.getByRole('button', { name: /Edit My Profile|Post My Profile/i });
      if (await editProfileBtn.isVisible()) {
        await editProfileBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(GALLERY_DIR, `24_create_profile_card_${mode}.png`) });
        await page.getByRole('button', { name: 'Go back' }).click();
        await page.waitForTimeout(500);
      }

      // My HackMate Hub Screen (from Profile)
      const profileAvatar = page.getByLabel('User profile').first();
      await profileAvatar.click({ force: true });
      await page.waitForTimeout(600);
      const viewHackMateBtn = page.getByRole('button', { name: 'View HackMate' });
      if (await viewHackMateBtn.isVisible()) {
        await viewHackMateBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(GALLERY_DIR, `24b_hackfind_hub_${mode}.png`) });

        // My Teams Screen
        const myTeamsCard = page.getByText('My Teams').first();
        if (await myTeamsCard.isVisible()) {
          await myTeamsCard.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(GALLERY_DIR, `25_my_teams_${mode}.png`) });
          await page.getByRole('button', { name: 'Go back' }).click();
          await page.waitForTimeout(400);
        }

        // Team Join Requests Screen
        const viewRequestsBtn = page.getByRole('button', { name: 'View Requests' }).first();
        if (await viewRequestsBtn.isVisible()) {
          await viewRequestsBtn.click();
          await page.waitForTimeout(800);
          await page.screenshot({ path: path.join(GALLERY_DIR, `26_team_requests_${mode}.png`) });
          await page.getByRole('button', { name: 'Go back' }).click();
          await page.waitForTimeout(400);
        }
      }
    });
  }
});
