#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROTATE_INTERVAL_MS = 25000;
const WORDLIST_PATH = path.join(__dirname, "..", "data", "dutch-words.json");

function render() {
  const words = JSON.parse(fs.readFileSync(WORDLIST_PATH, "utf8"));
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("empty or malformed wordlist");
  }
  const bucket = Math.floor(Date.now() / ROTATE_INTERVAL_MS);
  const { dutch, english, phonetic, meaning } = words[bucket % words.length];
  const phoneticPart = phonetic ? `  [${phonetic}]` : "";
  const meaningPart = meaning ? ` | ${meaning}` : "";
  return `${english} → ${dutch}${phoneticPart}${meaningPart}`;
}

try {
  process.stdout.write(render());
} catch {
  // ccstatusline renders failures literally (e.g. "[Exit: 1]") into the
  // status line; fail silently instead so a bad build just hides the widget.
}
