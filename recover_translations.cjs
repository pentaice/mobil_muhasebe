const fs = require('fs');

const raw = fs.readFileSync('raw_step62.json', 'utf16le').trim();
if (!raw) {
  console.log("No data");
  process.exit(0);
}
// parse json
try {
  const obj = JSON.parse(raw);
  // transcript obj has obj.tool_calls? No, transcript format:
  // {"step_index":62,"source":"MODEL","type":"PLANNER_RESPONSE","content":"","tool_calls":[{"name":"default_api:write_to_file","arguments":{"CodeContent":"...
  
  if (obj.tool_calls && obj.tool_calls.length > 0) {
    const call = obj.tool_calls[0];
    if (call.name === 'write_to_file' || call.name === 'default_api:write_to_file') {
      const args = call.arguments || call.parameters;
      const code = args.CodeContent || args.code || args.content;
      fs.writeFileSync('src/i18n/translations.ts', code, 'utf8');
      console.log("RECOVERED translations.ts successfully!");
    } else {
      console.log("Tool call was", call.name);
    }
  } else {
    console.log("No tool calls found in step 62");
  }
} catch(e) {
  console.log("Error parsing:", e);
}
