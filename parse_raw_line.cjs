const fs = require('fs');
const raw = fs.readFileSync('raw_line2.txt', 'utf16le').trim();

try {
  const obj = JSON.parse(raw);
  
  if (obj.tool_calls) {
    const call = obj.tool_calls[0];
    const args = call.args || call.arguments || call.parameters || call;
    const code = args.CodeContent || args.code || args.content;
    if (code) {
        fs.writeFileSync('src/i18n/translations.ts', code, 'utf8');
        console.log("SUCCESS! Translations restored WITHOUT CORRUPTION.");
    } else {
        console.log("No code content found in args:", Object.keys(args));
    }
  }
} catch(e) {
  console.log(e);
}
