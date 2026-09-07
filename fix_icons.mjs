import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sourceIconPath = './public/app-icon.png';
const resDir = './android/app/src/main/res';

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  const sourceBuffer = fs.readFileSync(sourceIconPath);
  
  for (const [folder, size] of Object.entries(sizes)) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

    // 1. Regular icon (full size)
    const mainPng = await sharp(sourceBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), mainPng);
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), mainPng);

    // 2. Adaptive Icon Foreground (scaled down to fit within the 66% safe zone)
    // Adaptive icons are 108dp, safe zone is 72dp (which is exactly 66.6%)
    const fgLogoSize = Math.round(size * 0.66);
    
    const fgPng = await sharp(sourceBuffer)
      .resize(fgLogoSize, fgLogoSize, { fit: 'contain' })
      .extend({
        top: Math.floor((size - fgLogoSize) / 2),
        bottom: Math.ceil((size - fgLogoSize) / 2),
        left: Math.floor((size - fgLogoSize) / 2),
        right: Math.ceil((size - fgLogoSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
      
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), fgPng);

    console.log(`Generated correctly sized icons for ${folder} (${size}x${size})`);
  }

  console.log('All Android icons fixed! The adaptive foreground is now correctly padded.');
}

generateIcons().catch(console.error);
