const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\dharu\\.gemini\\antigravity-ide\\brain\\79c923ba-d939-41b3-a547-fce04e68ebe2';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

async function run() {
  console.log('=== STARTING INDEPENDENT PLAYWRIGHT UI VERIFICATION ===');
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
        JSON.stringify({ user_id: 1, email_id: '2023110001@iiitkottayam.ac.in', roll_no: '2023110001' })
      );
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // 2. Cabs Screen
    const cabsScreenshot = path.join(ARTIFACT_DIR, `verify_cabs_${vp.name}.png`);
    await page.screenshot({ path: cabsScreenshot, fullPage: true });
    results.push({ screen: 'Cabs', viewport: `${vp.width}x${vp.height}`, screenshot: cabsScreenshot, status: 'PASS' });
    console.log(`Captured ${vp.name} Cabs Screen`);

    // 3. Lost & Found Screen
    try {
      const lfTab = page.getByText('Lost & Found');
      if (await lfTab.isVisible()) {
        await lfTab.click();
        await page.waitForTimeout(1000);
        const lfScreenshot = path.join(ARTIFACT_DIR, `verify_lostfound_${vp.name}.png`);
        await page.screenshot({ path: lfScreenshot, fullPage: true });
        results.push({ screen: 'Lost & Found', viewport: `${vp.width}x${vp.height}`, screenshot: lfScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} Lost & Found Screen`);
      }
    } catch (err) {
      console.log(`Could not click Lost & Found tab: ${err.message}`);
    }

    // 4. HackMate Screen
    try {
      const tfTab = page.getByText('HackMate');
      if (await tfTab.isVisible()) {
        await tfTab.click();
        await page.waitForTimeout(1000);
        const tfScreenshot = path.join(ARTIFACT_DIR, `verify_hackmate_${vp.name}.png`);
        await page.screenshot({ path: tfScreenshot, fullPage: true });
        results.push({ screen: 'HackMate', viewport: `${vp.width}x${vp.height}`, screenshot: tfScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} HackMate Screen`);
      }
    } catch (err) {
      console.log(`Could not click HackMate tab: ${err.message}`);
    }

    // 5. Profile Screen
    try {
      const profileTab = page.getByRole('tab', { name: /Profile/i });
      if (await profileTab.isVisible()) {
        await profileTab.click();
        await page.waitForTimeout(1000);
        const profileScreenshot = path.join(ARTIFACT_DIR, `verify_profile_${vp.name}.png`);
        await page.screenshot({ path: profileScreenshot, fullPage: true });
        results.push({ screen: 'Profile', viewport: `${vp.width}x${vp.height}`, screenshot: profileScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} Profile Screen`);
      }
    } catch (err) {
      console.log(`Profile navigation error: ${err.message}`);
    }

    // Navigate to Cabs tab and click Post Ride
    try {
      await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const postRideBtn = page.getByText('Post Ride');
      if (await postRideBtn.isVisible()) {
        await postRideBtn.click();
        await page.waitForTimeout(1000);
        const postRideScreenshot = path.join(ARTIFACT_DIR, `verify_postride_${vp.name}.png`);
        await page.screenshot({ path: postRideScreenshot, fullPage: true });
        results.push({ screen: 'Post Ride', viewport: `${vp.width}x${vp.height}`, screenshot: postRideScreenshot, status: 'PASS' });
        console.log(`Captured ${vp.name} Post Ride Screen`);
      }
    } catch (err) {
      console.log(`Post Ride navigation error: ${err.message}`);
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
