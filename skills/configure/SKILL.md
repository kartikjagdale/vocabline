---
name: configure
description: Change how often Vocabline rotates to a new word. Use when the user asks to change the rotation speed, interval, or timing of the Vocabline status line widget.
disable-model-invocation: true
allowed-tools: Read, Write, Bash
---

Vocabline's runtime script (`bin/vocabline.js`) reads its rotation interval
from a small config file at `~/.config/vocabline/config.json`:

```json
{ "intervalSeconds": 35 }
```

If that file doesn't exist, it defaults to 35 seconds.

To change it:

1. Ask the user for their desired interval in seconds, if they haven't
   already given one. Sanity-check it's a positive number; a reasonable
   range is 5-3600. Anything shorter than ~5s risks looking jittery given
   how often status lines typically refresh.
2. Create the `~/.config/vocabline/` directory if it doesn't exist, and
   write (or overwrite) `~/.config/vocabline/config.json` with
   `{ "intervalSeconds": <value> }`.
3. Verify by running the plugin's `bin/vocabline.js` directly (resolve
   `${CLAUDE_PLUGIN_ROOT}` to its absolute path first) and confirm it still
   prints a valid line with no errors.
4. Tell the user the new interval takes effect on the next status line
   refresh, no restart needed.
