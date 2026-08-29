const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');
let lines = content.split('\\n');

let exportTIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export function t(lang:')) {
    exportTIndex = i;
    break;
  }
}

if (exportTIndex !== -1) {
  lines = lines.slice(0, exportTIndex);
}

// Append the functions manually to ensure NO garbage is left.
lines.push('export function t(lang: LanguageCode, key: keyof TranslationKeys): string {');
lines.push('  return translations[lang]?.[key] || translations.tr[key] || key;');
lines.push('}');
lines.push('');
lines.push('export function getTranslations(lang: LanguageCode): TranslationKeys {');
lines.push('  return translations[lang] || translations.tr;');
lines.push('}');
lines.push('');

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log("Cleanup successful.");
