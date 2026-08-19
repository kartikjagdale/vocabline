#!/usr/bin/env python3
"""One-time build step: extracts {dutch, english} pairs from the FreeDict
nld-eng StarDict dictionary, skipping entries already covered by the
hand-verified core list. Phonetics are NOT taken from here — build-wordlist.js
derives those uniformly via espeak-ng for consistency. Requires: pyglossary,
beautifulsoup4, wordfreq (pip install pyglossary beautifulsoup4 wordfreq).
"""
import json
import re
import sys
from pathlib import Path

import wordninja
from bs4 import BeautifulSoup
from pyglossary.glossary_v2 import Glossary
from wordfreq import top_n_list

HERE = Path(__file__).parent
FREEDICT_IFO = Path("/tmp/nld-eng/nld-eng.ifo")
CORE_WORDS_PATH = HERE / "seed-words.json"
OUT_PATH = HERE / "freedict-words.json"


def first_gloss(defi_html):
    """Walk the StarDict defi HTML and return the first sense's first word.
    Structure: <div>/<font>ipa</font>/<br><div>word</div></div>  (single sense)
    or ... <ol><li><div>word</div></li> ...</ol>  (senses, some nested for
    synonym groups of the same sense).
    """
    soup = BeautifulSoup(defi_html, "html.parser")
    root = soup.find("div")
    if root is None:
        return None
    ol = root.find("ol")
    if ol is None:
        # single-sense entry: last <div> holds the word
        divs = root.find_all("div")
        return divs[-1].get_text(strip=True) if divs else None
    first_li = ol.find("li")
    if first_li is None:
        return None
    inner_div = first_li.find("div")
    return inner_div.get_text(strip=True) if inner_div else None


def is_junk(word):
    stripped = word.lstrip("'")
    if len(stripped) <= 2 or not re.search(r"[a-zA-Z]", word):
        return True
    if word[0].isupper():  # proper nouns (names, nationalities) aren't vocab
        return True
    return False


def despace_gloss(gloss):
    """FreeDict's source data sometimes concatenates multi-word glosses with
    no spaces (e.g. 'alotof', 'tohim'). wordninja's frequency-based
    segmentation reliably passes genuine single words through unchanged and
    splits the concatenated ones."""
    return " ".join(wordninja.split(gloss))


def main():
    core_words = {e["dutch"].lower() for e in json.loads(CORE_WORDS_PATH.read_text())}

    Glossary.init()
    g = Glossary()
    g.directRead(str(FREEDICT_IFO))

    freq_rank = {w: i for i, w in enumerate(top_n_list("nl", 100_000))}

    out = []
    skipped_core = 0
    skipped_junk = 0
    skipped_no_gloss = 0
    seen = set()
    for entry in g:
        word = entry.s_word.strip()
        key = word.lower()
        if key in core_words:
            skipped_core += 1
            continue
        if key in seen:
            continue
        if is_junk(word):
            skipped_junk += 1
            continue
        gloss = first_gloss(entry.defi)
        if not gloss or not re.search(r"[a-zA-Z]", gloss):
            skipped_no_gloss += 1
            continue
        gloss = despace_gloss(gloss)
        seen.add(key)
        out.append({"dutch": word, "english": gloss, "rank": freq_rank.get(key, 10**9)})

    out.sort(key=lambda e: e["rank"])
    for e in out:
        del e["rank"]

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {len(out)} entries to {OUT_PATH}", file=sys.stderr)
    print(f"skipped: core={skipped_core} junk={skipped_junk} no_gloss={skipped_no_gloss}", file=sys.stderr)


if __name__ == "__main__":
    main()
