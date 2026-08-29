const fs = require('fs');
const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace literal "\n" strings that were inserted by mistake with real newlines
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed newlines!");
