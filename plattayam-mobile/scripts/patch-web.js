const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'dist', 'index.html');
if (fs.existsSync(file)) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(
    /content="width=device-width, initial-scale=1[^"]*"/,
    'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"'
  );
  fs.writeFileSync(file, html, 'utf8');
  console.log('Successfully patched dist/index.html with mobile viewport anti-zoom meta tag.');
}
