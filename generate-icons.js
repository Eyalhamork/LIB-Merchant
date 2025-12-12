// scripts/generate-icons.js
// Script to generate PWA icons from a source image

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = path.join(__dirname, '../public/icon-source.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate icons
async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size} icon:`, error.message);
    }
  }

  console.log('Done!');
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error('Error: icon-source.png not found in public directory');
  console.log('Please add a source image (icon-source.png) to the public directory');
  console.log('Recommended: 512x512 PNG with transparent background');
  process.exit(1);
}

generateIcons().catch(console.error);
