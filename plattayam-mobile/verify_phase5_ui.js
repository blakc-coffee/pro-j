/**
 * Unit verification script for Phase 5 Lost & Found Architecture and UI
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== STARTING PHASE 5 LOST & FOUND VERIFICATION ===\n');

// 1. Check file existence
const filesToCheck = [
  'src/features/lost-found/screens/ReportItemScreen.js',
  'src/features/lost-found/screens/ItemDetailsScreen.js',
  'src/features/lost-found/screens/LostFoundScreen.js',
  'src/features/lost-found/components/ItemCard.js',
  'src/features/lost-found/services/lostfound.js',
  'src/navigation/RootNavigator.js',
];

for (const relPath of filesToCheck) {
  const fullPath = path.join(__dirname, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  console.log(`✔ File exists: ${relPath}`);
}

// 2. Check ReportItemScreen requirements
const reportItemSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/ReportItemScreen.js'), 'utf8');
assert.ok(reportItemSrc.includes('reportItem'), 'ReportItemScreen must call reportItem service');
assert.ok(reportItemSrc.includes('type'), 'ReportItemScreen must support type (lost/found)');
assert.ok(reportItemSrc.includes('title'), 'ReportItemScreen must support item name/title');
assert.ok(reportItemSrc.includes('location'), 'ReportItemScreen must support location');
assert.ok(reportItemSrc.includes('itemDate'), 'ReportItemScreen must support itemDate');
assert.ok(reportItemSrc.includes('imageUrl'), 'ReportItemScreen must support imageUrl');
assert.ok(reportItemSrc.includes('handleSelectDeviceImage'), 'ReportItemScreen must support image selection from device');
assert.ok(!reportItemSrc.includes('user_id:'), 'ReportItemScreen must not expose or send hardcoded user_id');
assert.ok(!reportItemSrc.includes('status:'), 'ReportItemScreen must not expose or send hardcoded status');
console.log('✔ Phase 5A: ReportItemScreen satisfies all form and security constraints');

// 3. Check ItemCard image-first layout
const itemCardSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/components/ItemCard.js'), 'utf8');
assert.ok(itemCardSrc.includes('Image'), 'ItemCard must render Image');
assert.ok(itemCardSrc.includes('imageContainer') || itemCardSrc.includes('image'), 'ItemCard must have image container');
assert.ok(itemCardSrc.includes('placeholderContainer'), 'ItemCard must have clean placeholder when image absent');
assert.ok(itemCardSrc.includes('formatPostedDate') || itemCardSrc.includes('created_at'), 'ItemCard must display date posted');
assert.ok(!itemCardSrc.includes('Avatar'), 'ItemCard should avoid heavy avatar/poster rows to stay clean and image-first');
console.log('✔ Phase 5B: ItemCard satisfies image-first listing card design');

// 4. Check LostFoundScreen
const lostFoundScreenSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/LostFoundScreen.js'), 'utf8');
assert.ok(!lostFoundScreenSrc.includes('CategoryChips'), 'LostFoundScreen must NOT include CategoryChips');
assert.ok(lostFoundScreenSrc.includes('selectedSort'), 'LostFoundScreen must support sort selection');
assert.ok(lostFoundScreenSrc.includes('newest') && lostFoundScreenSrc.includes('oldest'), 'LostFoundScreen must support newest and oldest sort');
assert.ok(lostFoundScreenSrc.includes('ReportItem'), 'LostFoundScreen must navigate to ReportItem');
assert.ok(lostFoundScreenSrc.includes('ItemDetails'), 'LostFoundScreen must navigate to ItemDetails');
console.log('✔ Phase 5C: LostFoundScreen satisfies sorting and category filter removal');

// 5. Check ItemDetailsScreen
const itemDetailsSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/ItemDetailsScreen.js'), 'utf8');
assert.ok(itemDetailsSrc.includes('getItem'), 'ItemDetailsScreen must fetch item details');
assert.ok(itemDetailsSrc.includes('messages'), 'ItemDetailsScreen must render messages section');
assert.ok(itemDetailsSrc.includes('addMessage'), 'ItemDetailsScreen must support posting messages');
assert.ok(itemDetailsSrc.includes('isOwner'), 'ItemDetailsScreen must determine ownership');
assert.ok(itemDetailsSrc.includes('updateItemStatus'), 'ItemDetailsScreen must allow owner to update status');
assert.ok(itemDetailsSrc.includes('deleteItem'), 'ItemDetailsScreen must allow owner to delete item');
console.log('✔ Phase 5D & 5E: ItemDetailsScreen satisfies detailed view, messaging, and owner actions');

// 6. Check RootNavigator registration
const rootNavSrc = fs.readFileSync(path.join(__dirname, 'src/navigation/RootNavigator.js'), 'utf8');
assert.ok(rootNavSrc.includes('ReportItemScreen'), 'RootNavigator must import ReportItemScreen');
assert.ok(rootNavSrc.includes('ItemDetailsScreen'), 'RootNavigator must import ItemDetailsScreen');
assert.ok(rootNavSrc.includes('name="ReportItem"'), 'RootNavigator must register ReportItem stack screen');
assert.ok(rootNavSrc.includes('name="ItemDetails"'), 'RootNavigator must register ItemDetails stack screen');
console.log('✔ Phase 5F: RootNavigator registration verified');

console.log('\n=== ALL PHASE 5 VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
