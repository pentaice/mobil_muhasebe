import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = './public/app-icon.svg';
const svgBuffer = fs.readFileSync(svgPath);

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

    const pngBuffer = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(targetFolder, 'ic_launcher.png'), pngBuffer);
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_round.png'), pngBuffer);
    fs.writeFileSync(path.join(targetFolder, 'ic_launcher_foreground.png'), pngBuffer);
    console.log(`Generated ${folder} (${size}x${size})`);
  }

  // Also 512x512 for web & public
  const icon512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync('./public/app-icon.png', icon512);
  fs.writeFileSync('./public/favicon.png', icon512);

  const icon192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync('./public/favicon.ico', icon192);

  console.log('All vector app icons generated cleanly with pixel-perfect sharp clarity!');
}

generateIcons().catch(console.error);
