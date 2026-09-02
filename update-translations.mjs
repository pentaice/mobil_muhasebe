import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/i18n/translations.ts');
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('autoSaveSheets: string;')) {
  // 1. Add to interface
  content = content.replace(
    /privacyTitle: string;/g,
    'privacyTitle: string;\n  autoSaveSheets: string;\n  autoSaveSheetsDesc: string;'
  );

  // 2. Add to tr
  content = content.replace(
    /privacyTitle: 'Gizlilik Politikası',/g,
    "privacyTitle: 'Gizlilik Politikası',\n    autoSaveSheets: 'Otomatik E-Tablo Yedekleme',\n    autoSaveSheetsDesc: 'Uygulamaya girişte (günde 1 kez) E-Tablolara otomatik yedekler.',"
  );

  // 3. Add to other langs
  content = content.replace(
    /privacyTitle: 'Privacy Policy',/g,
    "privacyTitle: 'Privacy Policy',\n    autoSaveSheets: 'Auto Sheets Backup',\n    autoSaveSheetsDesc: 'Automatically backs up to Sheets once a day on app open.',"
  );

  fs.writeFileSync(file, content);
  console.log('Added translation keys successfully.');
} else {
  console.log('Keys already exist.');
}
