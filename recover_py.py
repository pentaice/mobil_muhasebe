import json
import codecs

with codecs.open('C:\\\\Users\\\\Emre\\\\.gemini\\\\antigravity-ide\\\\brain\\\\77263ea7-d4d9-47f2-9a98-92f140c34e84\\\\.system_generated\\\\logs\\\\transcript_full.jsonl', 'r', 'utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line.strip())
            if 'tool_calls' in obj:
                for call in obj['tool_calls']:
                    args = call.get('arguments', call.get('parameters', call))
                    if 'TargetFile' in args and 'translations.ts' in args['TargetFile']:
                        code = args.get('CodeContent', args.get('code', args.get('content')))
                        if code:
                            with codecs.open('src/i18n/translations.ts', 'w', 'utf-8') as out:
                                out.write(code)
                            print("RECOVERED PERFECTLY VIA PYTHON!")
                            exit(0)
        except Exception as e:
            pass

print("Not found in Python either")
