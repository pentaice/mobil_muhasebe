const fs = require('fs');

const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// interface
content = content.replace(/(daily:\s*string;)/g, "twiceDaily: string;\n  $1");

// tr
content = content.replace(/(daily:\s*'Her Gün',)/g, "twiceDaily: 'Günde 2 Kez',\n    $1");

// en
content = content.replace(/(daily:\s*'Daily',)/g, "twiceDaily: 'Twice a Day',\n    $1");

// hi
content = content.replace(/(daily:\s*'दैनिक',)/g, "twiceDaily: 'दिन में दो बार',\n    $1");

// zh
content = content.replace(/(daily:\s*'每天',)/g, "twiceDaily: '每天两次',\n    $1");

// es
content = content.replace(/(daily:\s*'Diario',)/g, "twiceDaily: 'Dos veces al día',\n    $1");

// fr
content = content.replace(/(daily:\s*'Quotidien',)/g, "twiceDaily: 'Deux fois par jour',\n    $1");

fs.writeFileSync(path, content, 'utf8');
console.log("Translations added.");
