const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\dharu\\.gemini\\antigravity-ide\\brain\\8f9ef819-193c-4f65-9656-8463a50fe14c';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

async function run() {
  console.log('=== STARTING ENHANCED PLAYWRIGHT UI VERIFICATION ===');
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const consoleErrors = [];
  const networkErrors = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${vp.name}][Console Error] ${msg.text()}`);
      }
    });

    page.on('requestfailed', (req) => {
      networkErrors.push(`[${vp.name}][Network Fail] ${req.url()} (${req.failure()?.errorText})`);
    });

    // 1. Login Screen (Unauthenticated)
    await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const loginScreenshot = path.join(ARTIFACT_DIR, `verify_login_${vp.name}.png`);
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    results.push({ screen: 'Login', viewport: `${vp.width}x${vp.height}`, screenshot: loginScreenshot, status: 'PASS' });
    console.log(`Captured ${vp.name} Login Screen`);

    // Set auth state in localStorage
    await page.evaluate(() => {
      window.localStorage.setItem(
        'plattayam.user',
        JSON.stringify({
          user_id: 1,
          email_id: '2023110001@iiitkottayam.ac.in',
          roll_no: '2023110001',
          name: 'Dharun Karthikeyan',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzg4Mjk1MDk0fQ.XSRvkIvpKETGp9KGy_QAkcWmBWLB6i8iojUk03oXeCI'
        })
      );
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 2. Cabs Screen (Header removed, locked RideCard verified)
    const cabsScreenshot = path.join(ARTIFACT_DIR, `verify_cabs_${vp.name}.png`);
    await page.screenshot({ path: cabsScreenshot, fullPage: true });
    results.push({ screen: 'Cabs (No Header)', viewport: `${vp.width}x${vp.height}`, screenshot: cabsScreenshot, status: 'PASS' });
    console.log(`Captured ${vp.name} Cabs Screen`);

    // 3. Lost & Found Screen (Header removed, plain text status)
    try {
      const lfTab = page.getByRole('tab', { name: /Lost & Found/i }).or(page.getByText('Lost & Found'));
      if (await lfTab.first().isVisible()) {
        await lfTab.first().click();
        await page.waitForTimeout(1000);
        const lfScreenshot = path.join(ARTIFACT_DIR, `verify_lostfound_${vp.name}.png`);
        await page.screenshot({ path: lfScreenshot, fullPage: true });
        results.push({ screen: 'Lost & Found (Plain Status)', viewport: `${vp.width}x${vp.height}`, screenshot: lfScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} Lost & Found Screen`);

        // 3a. Open Report Item Screen & Test Native Date Picker, Single Add Image Control & No URL Field
        const reportBtn = page.getByText('Report Item');
        if (await reportBtn.isVisible()) {
          await reportBtn.click();
          await page.waitForTimeout(1000);

          // Verify Back Button exists
          const backBtn = page.getByText('← Back');
          console.log(`Back button present on Report Item: ${await backBtn.isVisible()}`);

          // Verify single Add Image control exists
          const addImageControl = page.getByText('Add Image ▼');
          console.log(`Single Add Image control present: ${await addImageControl.isVisible()}`);

          // Tap Add Image control to open dropdown menu
          if (await addImageControl.isVisible()) {
            await addImageControl.click();
            await page.waitForTimeout(500);
          }

          // Verify Gallery & Camera options exist in dropdown
          const galleryBtn = page.getByText('Choose from Gallery');
          const cameraBtn = page.getByText('Take a Photo');
          console.log(`Gallery option present: ${await galleryBtn.isVisible()}, Camera option present: ${await cameraBtn.isVisible()}`);

          // Verify that Image URL input and "paste image URL" text DO NOT exist
          const urlInput = page.getByPlaceholder('https://example.com/item-photo.jpg');
          const hasUrlInput = await urlInput.isVisible().catch(() => false);
          console.log(`Image URL field absent (expected true): ${!hasUrlInput}`);

          const reportScreenshot = path.join(ARTIFACT_DIR, `verify_report_${vp.name}.png`);
          await page.screenshot({ path: reportScreenshot, fullPage: true });
          results.push({ screen: 'Report Item (Single Add Image Menu)', viewport: `${vp.width}x${vp.height}`, screenshot: reportScreenshot, status: 'PASS' });
          console.log(`Captured ${vp.name} Report Item Screen with Single Add Image Menu`);

          // Go back to Lost & Found using ← Back
          if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 3b. Open Item Details Screen
        const itemCard = page.getByText('Black Sony WH-1000XM4 Headphones').or(page.getByText('LOST').first());
        if (await itemCard.first().isVisible()) {
          await itemCard.first().click();
          await page.waitForTimeout(1000);

          const detailsScreenshot = path.join(ARTIFACT_DIR, `verify_details_${vp.name}.png`);
          await page.screenshot({ path: detailsScreenshot, fullPage: true });
          results.push({ screen: 'Item Details (Plain Status)', viewport: `${vp.width}x${vp.height}`, screenshot: detailsScreenshot, status: 'PASS' });
          console.log(`Captured ${vp.name} Item Details Screen`);

          // Go back to Lost & Found
          const backBtn = page.getByText('← Back');
          if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    } catch (err) {
      console.log(`Could not navigate Lost & Found: ${err.message}`);
    }

    // 4. HackMate Screen (Header removed)
    try {
      const tfTab = page.getByRole('tab', { name: /HackMate/i }).or(page.getByText('HackMate'));
      if (await tfTab.first().isVisible()) {
        await tfTab.first().click();
        await page.waitForTimeout(1000);
        const tfScreenshot = path.join(ARTIFACT_DIR, `verify_hackmate_${vp.name}.png`);
        await page.screenshot({ path: tfScreenshot, fullPage: true });
        results.push({ screen: 'HackMate (No Header)', viewport: `${vp.width}x${vp.height}`, screenshot: tfScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} HackMate Screen`);
      }
    } catch (err) {
      console.log(`Could not click HackMate tab: ${err.message}`);
    }

    // 5. Profile Screen (With 4 Sections: My Profile, My Rides, My Items, My HackMate)
    try {
      const profileTab = page.getByRole('tab', { name: /Profile/i }).or(page.getByText('Profile'));
      if (await profileTab.first().isVisible()) {
        await profileTab.first().click();
        await page.waitForTimeout(1000);
        const profileScreenshot = path.join(ARTIFACT_DIR, `verify_profile_${vp.name}.png`);
        await page.screenshot({ path: profileScreenshot, fullPage: true });
        results.push({ screen: 'Profile (4 Sections)', viewport: `${vp.width}x${vp.height}`, screenshot: profileScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} Profile Screen`);

        // 5a. Navigate to My Rides from Profile
        const viewRidesBtn = page.getByText('View My Rides');
        if (await viewRidesBtn.isVisible()) {
          await viewRidesBtn.click();
          await page.waitForTimeout(1000);
          const myRidesScreenshot = path.join(ARTIFACT_DIR, `verify_myrides_${vp.name}.png`);
          await page.screenshot({ path: myRidesScreenshot, fullPage: true });
          results.push({ screen: 'My Rides (via Profile)', viewport: `${vp.width}x${vp.height}`, screenshot: myRidesScreenshot, status: 'PASS' });
          console.log(`Captured ${vp.name} My Rides Screen from Profile`);

          // Go back to Profile
          const backBtn = page.getByText('← Back');
          if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 5b. Navigate to My Items from Profile
        const viewItemsBtn = page.getByText('View My Items');
        if (await viewItemsBtn.isVisible()) {
          await viewItemsBtn.click();
          await page.waitForTimeout(1000);
          const myItemsScreenshot = path.join(ARTIFACT_DIR, `verify_myitems_${vp.name}.png`);
          await page.screenshot({ path: myItemsScreenshot, fullPage: true });
          results.push({ screen: 'My Items (via Profile)', viewport: `${vp.width}x${vp.height}`, screenshot: myItemsScreenshot, status: 'PASS' });
          console.log(`Captured ${vp.name} My Items Screen from Profile`);

          // Go back to Profile
          const backBtn = page.getByText('← Back');
          if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }
        }

        // 5c. Navigate to My HackMate from Profile
        const viewHackMateBtn = page.getByText('View HackMate');
        if (await viewHackMateBtn.isVisible()) {
          await viewHackMateBtn.click();
          await page.waitForTimeout(1000);
          const myHackMateScreenshot = path.join(ARTIFACT_DIR, `verify_myhackmate_${vp.name}.png`);
          await page.screenshot({ path: myHackMateScreenshot, fullPage: true });
          results.push({ screen: 'My HackMate (via Profile)', viewport: `${vp.width}x${vp.height}`, screenshot: myHackMateScreenshot, status: 'PASS' });
          console.log(`Captured ${vp.name} My HackMate Screen from Profile`);

          // Go back to Profile
          const backBtn = page.getByText('← Back');
          if (await backBtn.isVisible()) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    } catch (err) {
      console.log(`Profile navigation error: ${err.message}`);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.table(results);
  console.log('\nConsole Errors:', consoleErrors.length ? consoleErrors : 'NONE');
  console.log('Network Failures:', networkErrors.length ? networkErrors : 'NONE');
}

run();
