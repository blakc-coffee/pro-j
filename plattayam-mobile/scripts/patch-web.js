const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');
const htmlFile = path.join(distDir, 'index.html');

// 1. Copy public static assets (robots.txt, sitemap.xml, og-image.png, favicon.png) to dist/
if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    if (file === 'index.html') continue;
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied public/${file} -> dist/${file}`);
  }
}

// 2. Patch dist/index.html with title, anti-zoom viewport, and SEO metadata
if (fs.existsSync(htmlFile)) {
  let html = fs.readFileSync(htmlFile, 'utf8');

  // Anti-zoom mobile viewport
  html = html.replace(
    /<meta\s+name="viewport"[^>]*>/i,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );

  // SEO Page Title
  html = html.replace(
    /<title>.*?<\/title>/i,
    '<title>Plattayam | IIIT Kottayam Student Utility Platform</title>'
  );

  // Rich SEO and Open Graph metadata
  const seoTags = `
    <!-- Primary Meta Tags -->
    <meta name="google-site-verification" content="Ci5-2bCj9LFjMACIq1ZC4eFHhEG7TsmoJnoYDZfkv5o" />
    <meta name="title" content="Plattayam | IIIT Kottayam Student Utility Platform" />
    <meta name="description" content="All-in-one campus utility for IIIT Kottayam: cab sharing, hackathon team finder (HackMate), and lost & found management." />
    <meta name="keywords" content="IIIT Kottayam, Plattayam, cab sharing, hackmate, hackathon team, lost and found, campus utility" />
    <meta name="author" content="Plattayam Team" />
    <meta name="theme-color" content="#0284c7" />

    <!-- Open Graph / WhatsApp / Facebook / LinkedIn -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://plattayam.vercel.app/" />
    <meta property="og:site_name" content="Plattayam" />
    <meta property="og:title" content="Plattayam | IIIT Kottayam Student Utility Platform" />
    <meta property="og:description" content="All-in-one campus utility for IIIT Kottayam: cab sharing, hackathon team finder (HackMate), and lost & found management." />
    <meta property="og:image" content="https://plattayam.vercel.app/og-image.png" />

    <!-- Twitter / X Cards -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://plattayam.vercel.app/" />
    <meta property="twitter:title" content="Plattayam | IIIT Kottayam Student Utility Platform" />
    <meta property="twitter:description" content="All-in-one campus utility for IIIT Kottayam: cab sharing, hackathon team finder (HackMate), and lost & found management." />
    <meta property="twitter:image" content="https://plattayam.vercel.app/og-image.png" />

    <!-- Favicon & Icons -->
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/og-image.png" />

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Plattayam",
      "url": "https://plattayam.vercel.app/",
      "applicationCategory": "StudentUtilityApplication",
      "operatingSystem": "All",
      "description": "All-in-one campus utility for IIIT Kottayam: cab sharing, hackathon team finder (HackMate), and lost & found management."
    }
    </script>
  `;

  if (!html.includes('google-site-verification')) {
    html = html.replace('<head>', '<head>\n    <meta name="google-site-verification" content="Ci5-2bCj9LFjMACIq1ZC4eFHhEG7TsmoJnoYDZfkv5o" />');
  }

  if (!html.includes('property="og:title"')) {
    html = html.replace('</head>', `${seoTags}\n  </head>`);
  }

  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log('Successfully patched dist/index.html with complete SEO metadata and viewport tags.');
}
