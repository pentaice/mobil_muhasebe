const fs = require('fs');

const logPath = 'C:\\\\Users\\\\Emre\\\\.gemini\\\\antigravity-ide\\\\brain\\\\77263ea7-d4d9-47f2-9a98-92f140c34e84\\\\.system_generated\\\\logs\\\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\\n');

let latestTranslationsOutput = '';

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    
    // Check inside tool responses
    if (obj.content) {
      if (typeof obj.content === 'string' && obj.content.includes('export type LanguageCode')) {
        latestTranslationsOutput = obj.content;
      }
      
      if (Array.isArray(obj.content)) {
        for (const item of obj.content) {
           if (item.type === 'tool_result' && item.output && item.output.includes('export type LanguageCode')) {
             latestTranslationsOutput = item.output;
           }
        }
      }
    }
  } catch(e) {}
}

fs.writeFileSync('extracted_translations.txt', latestTranslationsOutput);
console.log("Extracted length: ", latestTranslationsOutput.length);
