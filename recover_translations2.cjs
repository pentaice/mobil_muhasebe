const fs = require('fs');

const logPath = 'C:\\\\Users\\\\Emre\\\\.gemini\\\\antigravity-ide\\\\brain\\\\77263ea7-d4d9-47f2-9a98-92f140c34e84\\\\.system_generated\\\\logs\\\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const obj = JSON.parse(line);
    if (obj.step_index === 62 && obj.tool_calls && obj.tool_calls.length > 0) {
      const call = obj.tool_calls[0];
      if (call.name === 'write_to_file' || call.name === 'default_api:write_to_file') {
        const args = call.arguments || call.parameters;
        const code = args.CodeContent || args.code || args.content;
        fs.writeFileSync('src/i18n/translations.ts', code, 'utf8');
        console.log("RECOVERED translations.ts successfully!");
        process.exit(0);
      }
    }
  } catch(e) {}
}
console.log("Could not find step 62 in transcript");
