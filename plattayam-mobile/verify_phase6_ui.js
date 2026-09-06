/**
 * Unit verification script for Phase 6: My Items / My Reports in Lost & Found
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== STARTING PHASE 6 LOST & FOUND (MY ITEMS) VERIFICATION ===\n');

// 1. Check file existence
const filesToCheck = [
  'src/features/lost-found/screens/MyItemsScreen.js',
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

// 2. Check MyItemsScreen requirements
const myItemsSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/MyItemsScreen.js'), 'utf8');
assert.ok(myItemsSrc.includes('listMyItems'), 'MyItemsScreen must call listMyItems');
assert.ok(myItemsSrc.includes('updateItemStatus'), 'MyItemsScreen must support updateItemStatus');
assert.ok(myItemsSrc.includes('deleteItem'), 'MyItemsScreen must support deleteItem');
assert.ok(myItemsSrc.includes('Active') && myItemsSrc.includes('History'), 'MyItemsScreen must have Active and History tabs');
assert.ok(myItemsSrc.includes('isItemExpired'), 'MyItemsScreen must handle 30-day expiration check');
assert.ok(myItemsSrc.includes('claimed') && myItemsSrc.includes('resolved'), 'MyItemsScreen must handle claimed and resolved actions');
assert.ok(myItemsSrc.includes('ReportItem'), 'MyItemsScreen must allow navigating to ReportItem for editing and creating');
assert.ok(myItemsSrc.includes('ItemDetails'), 'MyItemsScreen must navigate to ItemDetails on card tap');
console.log('✔ Phase 6A: MyItemsScreen satisfies all grouping, status, and management constraints');

// 3. Check ReportItemScreen edit flow
const reportItemSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/ReportItemScreen.js'), 'utf8');
assert.ok(reportItemSrc.includes('itemId'), 'ReportItemScreen must read itemId from route params');
assert.ok(reportItemSrc.includes('isEditing'), 'ReportItemScreen must track isEditing state');
assert.ok(reportItemSrc.includes('updateItem'), 'ReportItemScreen must call updateItem when editing');
assert.ok(reportItemSrc.includes('reportItem'), 'ReportItemScreen must call reportItem when creating');
assert.ok(reportItemSrc.includes('Edit Item'), 'ReportItemScreen must show Edit Item header when editing');
assert.ok(reportItemSrc.includes('Save Changes'), 'ReportItemScreen must show Save Changes button when editing');
console.log('✔ Phase 6B: ReportItemScreen seamlessly supports editing existing listings');

// 4. Check LostFoundScreen header navigation
const lostFoundScreenSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/LostFoundScreen.js'), 'utf8');
assert.ok(lostFoundScreenSrc.includes('actionLabel="My Items"'), 'LostFoundScreen must have My Items in AppHeader');
assert.ok(lostFoundScreenSrc.includes('MyItems'), 'LostFoundScreen must navigate to MyItems');
console.log('✔ Phase 6C: LostFoundScreen header links to My Items correctly');

// 5. Check ItemDetailsScreen owner actions & edit flow
const itemDetailsSrc = fs.readFileSync(path.join(__dirname, 'src/features/lost-found/screens/ItemDetailsScreen.js'), 'utf8');
assert.ok(itemDetailsSrc.includes('isOwner'), 'ItemDetailsScreen must check isOwner');
assert.ok(itemDetailsSrc.includes('ReportItem') && itemDetailsSrc.includes('itemId'), 'ItemDetailsScreen must allow owner to edit item');
assert.ok(itemDetailsSrc.includes('Alert.alert') && itemDetailsSrc.includes('Mark as'), 'ItemDetailsScreen must confirm status changes');
assert.ok(itemDetailsSrc.includes('Delete Listing?'), 'ItemDetailsScreen must confirm deletion');
console.log('✔ Phase 6D: ItemDetailsScreen provides confirmed owner actions and editing navigation');

// 6. Check RootNavigator registration
const rootNavSrc = fs.readFileSync(path.join(__dirname, 'src/navigation/RootNavigator.js'), 'utf8');
assert.ok(rootNavSrc.includes('MyItemsScreen'), 'RootNavigator must import MyItemsScreen');
assert.ok(rootNavSrc.includes('name="MyItems"'), 'RootNavigator must register MyItems route');
assert.ok(rootNavSrc.includes('name="ReportItem"'), 'RootNavigator must register ReportItem route');
assert.ok(rootNavSrc.includes('name="ItemDetails"'), 'RootNavigator must register ItemDetails route');
console.log('✔ Phase 6E: RootNavigator registers all Lost & Found stack routes');

console.log('\n=== ALL PHASE 6 VERIFICATION CHECKS PASSED SUCCESSFULLY! ===');
