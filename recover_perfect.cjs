const fs = require('fs');
const logPath = 'C:\\\\Users\\\\Emre\\\\.gemini\\\\antigravity-ide\\\\brain\\\\77263ea7-d4d9-47f2-9a98-92f140c34e84\\\\.system_generated\\\\logs\\\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\\n');

let latestTranslations = null;

for (const line of lines) {
  if (!line || !line.startsWith('{"')) continue;
  if (line.includes('Tam i18n') && line.includes('translations.ts')) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          const args = call.args || call.arguments || call.parameters || call;
          const code = args.CodeContent || args.code || args.content;
          if (code && typeof code === 'string' && code.includes('export const translations = {')) {
             latestTranslations = code;
             console.log("Found matching tool call with CodeContent!");
          }
        }
      }
    } catch(e) {
    }
  }
}

if (latestTranslations) {
    fs.writeFileSync('src/i18n/translations.ts', latestTranslations, 'utf8');
    console.log("SUCCESS! Translations perfectly restored from UTF-8 transcript.");
} else {
    console.log("Failed to find translations.ts code in transcript.");
}
