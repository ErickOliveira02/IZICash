const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Background color (same as theme)
const bgColor = '#0f172a';

// Logo SVG with brand color
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" stroke-width="6"/>
  <line x1="25" y1="30" x2="55" y2="30" stroke="#10b981" stroke-width="6" stroke-linecap="round"/>
  <polyline points="25,70 45,50 55,60 75,35" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// iOS splash screen sizes
const splashSizes = [
  // iPhone SE, 8
  { width: 750, height: 1334, name: 'splash-750x1334' },
  // iPhone 8 Plus
  { width: 1242, height: 2208, name: 'splash-1242x2208' },
  // iPhone X, XS, 11 Pro
  { width: 1125, height: 2436, name: 'splash-1125x2436' },
  // iPhone XR, 11
  { width: 828, height: 1792, name: 'splash-828x1792' },
  // iPhone XS Max, 11 Pro Max
  { width: 1242, height: 2688, name: 'splash-1242x2688' },
  // iPhone 12 mini, 13 mini
  { width: 1080, height: 2340, name: 'splash-1080x2340' },
  // iPhone 12, 13, 14
  { width: 1170, height: 2532, name: 'splash-1170x2532' },
  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  { width: 1284, height: 2778, name: 'splash-1284x2778' },
  // iPhone 14 Pro, 15, 15 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556' },
  // iPhone 14 Pro Max, 15 Plus, 15 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796' },
  // iPad (portrait)
  { width: 1536, height: 2048, name: 'splash-1536x2048' },
  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'splash-1668x2388' },
  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'splash-2048x2732' },
];

async function generateSplash(size) {
  const { width, height, name } = size;

  // Logo size (about 20% of the smaller dimension)
  const logoSize = Math.min(width, height) * 0.2;

  // Create logo buffer
  const logoBuffer = Buffer.from(logoSvg);
  const resizedLogo = await sharp(logoBuffer)
    .resize(Math.round(logoSize), Math.round(logoSize))
    .png()
    .toBuffer();

  // Create background with centered logo
  const splash = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: bgColor
    }
  })
    .composite([
      {
        input: resizedLogo,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(path.join(assetsDir, `${name}.png`));

  console.log(`Generated: ${name}.png (${width}x${height})`);
}

async function main() {
  console.log('Generating iOS splash screens...\n');

  for (const size of splashSizes) {
    await generateSplash(size);
  }

  console.log('\nDone! Add the following to your index.html <head>:\n');

  // Generate link tags
  splashSizes.forEach(({ width, height, name }) => {
    console.log(`<link rel="apple-touch-startup-image" href="assets/${name}.png" media="(device-width: ${Math.round(width/3)}px) and (device-height: ${Math.round(height/3)}px) and (-webkit-device-pixel-ratio: 3)">`);
  });
}

main().catch(console.error);
