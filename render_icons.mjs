import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const mainSvgPath = './public/app-icon.svg';
const fgSvgPath = './public/app-icon-foreground.svg';

const mainSvgBuffer = fs.readFileSync(mainSvgPath);
const fgSvgBuffer = fs.readFileSync(fgSvgPath);

const resDir = './android/app/src/main/res';

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

    // Legacy full launcher icon
    const mainPng = await sharp(mainSvgBuffer).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), mainPng);
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), mainPng);

    // Adaptive icon foreground layer (transparent, safe-zone scaled)
    const fgPng = await sharp(fgSvgBuffer).resize(size, size).png().toBuffer();
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), fgPng);

    console.log(`Generated ${folder} (${size}x${size})`);
  }

  // Web & public icons (512x512, 192x192)
  const icon512 = await sharp(mainSvgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync('./public/app-icon.png', icon512);
  fs.writeFileSync('./public/favicon.png', icon512);

  const icon192 = await sharp(mainSvgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync('./public/favicon.ico', icon192);

  console.log('All vector app icons and adaptive foreground layers generated cleanly!');
}

generateIcons().catch(console.error);
