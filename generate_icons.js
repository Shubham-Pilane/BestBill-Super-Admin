import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

const sourceImage = path.join(process.cwd(), 'app_icon.jpg');
const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
  console.log('Generating Android launcher icons from app_icon.jpg...');
  for (const { folder, size } of sizes) {
    const folderPath = path.join(resDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const launcherPath = path.join(folderPath, 'ic_launcher.png');
    const roundPath = path.join(folderPath, 'ic_launcher_round.png');
    const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');

    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(launcherPath);

    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(roundPath);

    await sharp(sourceImage)
      .resize(size, size)
      .png()
      .toFile(foregroundPath);

    console.log(`Generated ${size}x${size} icons for ${folder}`);
  }
  console.log('All launcher icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
