const fs = require('fs');
const logPath = 'C:\\\\Users\\\\Emre\\\\.gemini\\\\antigravity-ide\\\\brain\\\\77263ea7-d4d9-47f2-9a98-92f140c34e84\\\\.system_generated\\\\logs\\\\transcript_full.jsonl';
const raw = fs.readFileSync(logPath, 'utf8');

const matchStr = '"TargetFile":"c:\\\\\\\\Users\\\\\\\\Emre\\\\\\\\Documents\\\\\\\\GitHub\\\\\\\\mobil_muhasebe\\\\\\\\src\\\\\\\\i18n\\\\\\\\translations.ts"';
const idx = raw.indexOf(matchStr);

if (idx !== -1) {
  // Find the start of this json line
  const lineStart = raw.lastIndexOf('\\n', idx) + 1;
  const lineEnd = raw.indexOf('\\n', idx);
  const line = raw.substring(lineStart, lineEnd !== -1 ? lineEnd : undefined);
  
  try {
    const obj = JSON.parse(line);
    const call = obj.tool_calls[0];
    const args = call.arguments || call.parameters;
    const code = args.CodeContent || args.code || args.content;
    fs.writeFileSync('src/i18n/translations.ts', code, 'utf8');
    console.log("SUCCESS");
  } catch(e) {
    console.log(e);
  }
} else {
  console.log("Match not found");
}
