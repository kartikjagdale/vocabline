#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_INTERVAL_SECONDS = 25;
const CONFIG_PATH = path.join(os.homedir(), ".config", "vocabline", "config.json");
const WORDLIST_PATH = path.join(__dirname, "..", "data", "dutch-words.json");

function getIntervalMs() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    const seconds = Number(config.intervalSeconds);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  } catch {
    // no config file, or it's malformed - fall through to the default
  }
  return DEFAULT_INTERVAL_SECONDS * 1000;
}

function render() {
  const words = JSON.parse(fs.readFileSync(WORDLIST_PATH, "utf8"));
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("empty or malformed wordlist");
  }
  const bucket = Math.floor(Date.now() / getIntervalMs());
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
