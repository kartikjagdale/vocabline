---
name: setup
description: One-time setup for the Vocabline plugin. Wires the rotating English/Dutch vocabulary widget into the user's Claude Code status line. Run this once right after installing the plugin, or whenever the user asks to set up or enable Vocabline. For changing the rotation speed of an already-set-up widget, use the separate "configure" skill instead.
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Bash
---

You are wiring up the Vocabline plugin. The plugin ships a runtime script at
`${CLAUDE_PLUGIN_ROOT}/bin/vocabline.js` (executable, takes no arguments,
prints one line like `house → huis  [huys] | a dwelling that serves as
living quarters for one or more families`, deterministic from wall-clock
time — no side effects, safe to run repeatedly). Your job is to make Claude
Code's status line invoke that script.

Resolve `${CLAUDE_PLUGIN_ROOT}` to its actual absolute path first (e.g. via
`echo`), and always write the literal resolved absolute path into any config
file — never write the literal string `${CLAUDE_PLUGIN_ROOT}` into JSON
config, since only skill/hook content is guaranteed to expand that
placeholder, not arbitrary config consumers like ccstatusline.

Follow these steps:

1. **Detect the current setup.**
   - Read `~/.claude/settings.json` (create-if-missing: treat absence as "no
     statusLine configured").
   - If its `statusLine.command` is `"ccstatusline"` (or contains
     `ccstatusline`), this is the **ccstatusline case**. Read
     `~/.config/ccstatusline/settings.json`.
   - Else if `statusLine` is absent entirely, this is the **no-statusline
     case**.
   - Else `statusLine` exists but points at something else, this is the
     **custom/unknown case**.

2. **ccstatusline case:**
   - In `~/.config/ccstatusline/settings.json`, `lines` is an array of
     arrays of widget objects. Append a new widget object to the **last**
     line array (add a new empty array to `lines` first only if the last
     line is non-empty and you want a dedicated new line — prefer reusing
     an existing empty `[]` line if one exists, e.g. `"lines": [[...], [...], []]`
     has a ready-made empty third line):
     ```json
     {
       "id": "vocabline",
       "type": "custom-command",
       "commandPath": "<resolved absolute path>/bin/vocabline.js",
       "timeout": 500,
       "color": "cyan"
     }
     ```
   - Show the user the exact before/after diff of this file and get their
     explicit go-ahead before writing (this is a global, shared config file —
     do not edit it silently).
   - Back up the original file first, e.g. copy it to
     `~/.config/ccstatusline/settings.json.bak-<unix-timestamp-you-can-derive-from-`date`>`.

3. **No-statusline case:**
   - Propose setting, in `~/.claude/settings.json`:
     ```json
     "statusLine": {
       "type": "command",
       "command": "node <resolved absolute path>/bin/vocabline.js",
       "refreshInterval": 25
     }
     ```
   - Show the diff, get explicit confirmation, back up
     `~/.claude/settings.json` first, then write.

4. **Custom/unknown case:**
   - Do NOT overwrite their existing `statusLine`. Explain what's currently
     configured and ask the user how they'd like to proceed: e.g. wrap their
     existing command in a small shell script that runs it and then appends
     a newline with `node <path>/bin/vocabline.js`'s output, or have them
     add it manually. Only proceed once they've told you which they want.

5. **Verify.** After writing, run the script directly
   (`node <resolved path>/bin/vocabline.js`) to confirm it prints a line
   like `house → huis  [huys] | a dwelling that serves as living quarters
   for one or more families` with no errors, and tell the user the status
   line will pick it up on its next refresh (within ~25s, or after
   restarting/reopening their terminal if it doesn't auto-refresh).

If the user later asks to uninstall/undo, restore the `.bak` file you created
and remove it.
