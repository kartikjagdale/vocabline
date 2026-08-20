#!/usr/bin/env node
"use strict";

// One-time build step. Merges:
//   scripts/seed-words.json      — hand-verified core (~300 words/phrases)
//   scripts/freedict-words.json  — FreeDict nld-eng extraction (~20k words,
//                                  see extract-freedict.py; GPL-2.0 data,
//                                  see ../NOTICE)
// then derives phonetics for everything in ONE batched espeak-ng call (piping
// words line-by-line over stdin preserves one-output-line-per-input-line,
// which is ~1000x faster than spawning a process per word) and writes
// data/dutch-words.json. Requires espeak-ng on PATH; not needed at runtime.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const CORE_PATH = path.join(__dirname, "seed-words.json");
const FREEDICT_PATH = path.join(__dirname, "freedict-words.json");
const OUT_PATH = path.join(__dirname, "..", "data", "dutch-words.json");

// Ordered longest-match-first. Each entry consumes input left-to-right in a
// single pass (see ipaToRespelling) — sequential global string-replace
// causes cascading re-substitution garbage, since one rule's output (e.g.
// ɪ -> "i") gets re-matched by a later rule (e.g. "i" -> "ee"). A single
// left-to-right scan over the ORIGINAL IPA avoids that.
const ZWJ = "‍";
const COMBINING_TILDE = "̃"; // nasalization mark on French loanwords
const IPA_MAP = [
  ["ˈ", ""], ["ˌ", ""], ["ː", ""], [ZWJ, ""], [COMBINING_TILDE, ""],
  ["ɡ", "g"], // IPA "script g" (U+0261), distinct codepoint from ASCII g
  [`ɛ${ZWJ}ɪ`, "ey"], [`ʌ${ZWJ}ʊ`, "ow"], [`œ${ZWJ}y`, "uy"],
  // espeak mistranscribes the long "eer" sound (/eːr/) as ɪː before r (e.g.
  // "veertien", "wereld", "kleren") instead of e; respell as "ayr" to match
  // how "week"-type long-e words are already respelled. Cover both with and
  // without the length mark, since it's inconsistently present.
  ["ɪːr", "ayr"], ["ɪr", "ayr"],
  // ɣ (voiced) and x (voiceless) are both the Dutch guttural sound with no
  // real English equivalent; "gh"/"ch" read as hard-g/church to English
  // eyes, so both collapse to "kh".
  ["ɣ", "kh"], ["x", "kh"],
  ["ʃ", "sh"], ["ʒ", "zh"], ["ŋ", "ng"],
  // palatalization (mostly the "-tje"/"-etje" diminutive suffix) and the
  // palatal nasal (like Spanish ñ), e.g. "beetje", "oranje".
  ["ʲ", "y"], ["ɲ", "ny"],
  ["ɪ", "i"], ["i", "ee"], ["ɛ", "eh"], ["e", "ay"],
  ["ɑ", "ah"], ["a", "ah"], ["ɔ", "o"], ["o", "oh"],
  ["u", "oo"], ["ʏ", "u"], ["y", "ew"], ["ø", "eu"], ["œ", "eu"],
  ["ə", "uh"], ["ɵ", "u"], ["ʌ", "u"], ["ʊ", "oo"],
  // ʋ (Dutch w-ish sound) collapses onto "v" if mapped that way, colliding
  // with genuine Dutch v (e.g. "wij"/"vier" become indistinguishable); use
  // "w" instead, which reads closer to the real sound anyway.
  ["ʋ", "w"],
  ["ɾ", "r"], ["ʁ", "r"], ["j", "y"],
].sort((a, b) => b[0].length - a[0].length);

function ipaToRespelling(ipa) {
  const cleaned = ipa.trim();
  let out = "";
  let i = 0;
  outer: while (i < cleaned.length) {
    for (const [from, to] of IPA_MAP) {
      if (cleaned.startsWith(from, i)) {
        out += to;
        i += from.length;
        continue outer;
      }
    }
    out += cleaned[i];
    i += 1;
  }
  return out
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
}

function getIpaBatch(dutchTexts) {
  const raw = execFileSync("espeak-ng", ["-v", "nl", "--ipa=3", "-q"], {
    input: dutchTexts.join("\n") + "\n",
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const lines = raw.split("\n");
  if (lines[lines.length - 1] === "") lines.pop(); // trailing newline
  // espeak-ng is supposed to emit exactly one output line per input line,
  // but some inputs (e.g. "..." mid-phrase) make it emit an extra line,
  // which silently misaligns every entry after it rather than failing
  // loudly - so this must be an exact match, not just "at least as many".
  if (lines.length !== dutchTexts.length) {
    throw new Error(
      `espeak-ng output line count (${lines.length}) !== input count (${dutchTexts.length}) - some input produced extra/fewer lines, check for "..." or stray periods in scripts/seed-words.json or scripts/freedict-words.json`
    );
  }
  return lines;
}

function main() {
  const core = JSON.parse(fs.readFileSync(CORE_PATH, "utf8"));
  const freedict = JSON.parse(fs.readFileSync(FREEDICT_PATH, "utf8"));
  const seeds = [...core, ...freedict];

  const ipaLines = getIpaBatch(seeds.map((e) => e.dutch));

  const out = seeds.map(({ dutch, english }, i) => {
    const phonetic = ipaToRespelling(ipaLines[i]);
    const showPhonetic = phonetic.toLowerCase() !== dutch.toLowerCase();
    return { dutch, english, phonetic: showPhonetic ? phonetic : null };
  });

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${out.length} entries to ${OUT_PATH}`);
}

main();
