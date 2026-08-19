#!/usr/bin/env python3
"""One-time build step: adds a `meaning` field to data/dutch-words.json by
looking up each entry's English gloss in WordNet (offline, no network).
Run AFTER build-wordlist.js. Requires: pip install nltk, then once:
python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
"""
import json
import re
from pathlib import Path

from nltk.corpus import wordnet as wn

DATA_PATH = Path(__file__).parent.parent / "data" / "dutch-words.json"

# Function words (pronouns, articles, prepositions, conjunctions,
# auxiliaries) almost always collide with an unrelated WordNet homograph
# (chemical element symbols, units, musical notes: "he"->helium, "in"->inch,
# "as"->arsenic, "so"->solfège, "am"->americium...) and don't have a
# meaningful "definition" a learner needs anyway, so skip lookup for these.
FUNCTION_WORDS = {
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
    "them", "my", "your", "his", "its", "our", "their", "mine", "yours",
    "hers", "ours", "theirs", "myself", "yourself", "himself", "herself",
    "itself", "ourselves", "yourselves", "themselves", "a", "an", "the",
    "in", "on", "at", "by", "for", "with", "from", "of", "about", "against",
    "between", "into", "through", "during", "before", "after", "above",
    "below", "up", "down", "out", "off", "over", "under", "and", "or",
    "but", "so", "because", "although", "if", "while", "as", "than",
    "that", "though", "is", "are", "am", "was", "were", "be", "been",
    "being", "do", "does", "did", "have", "has", "had", "will", "would",
    "shall", "should", "may", "might", "must", "can", "could", "not", "no",
    "yes", "there", "here", "when", "where", "why", "how", "who", "what",
    "which",
}


def lookup_key(english):
    # Use the first sense only (our own glosses sometimes join two with
    # "/"), strip a leading infinitive "to ", drop parentheticals.
    first = english.split("/")[0].strip()
    first = re.sub(r"\s*\([^)]*\)\s*", "", first).strip()
    first = re.sub(r"^to\s+", "", first, flags=re.IGNORECASE)
    return first.replace(" ", "_")


def best_synset(word, synsets):
    # wn.synsets() default order is NOT frequency-ordered (e.g. "nice" the
    # French city outranks the adjective sense). Lemma usage counts from
    # SemCor are; pick the synset whose lemma-count for this exact word is
    # highest, falling back to first if all are tied/zero.
    def count(s):
        lemma = next((l for l in s.lemmas() if l.name().lower() == word.lower()), None)
        return lemma.count() if lemma else 0

    return max(synsets, key=count)


def clean_definition(defi):
    # WordNet definitions sometimes trail off into a citation/example after
    # "; ", e.g. "...demanded by that force; - John D. Rockefeller Jr". Kept
    # as a full, untruncated sentence otherwise.
    return defi.split(";")[0].strip()


def main():
    entries = json.loads(DATA_PATH.read_text())
    found = 0
    for e in entries:
        key = lookup_key(e["english"])
        is_function_word = key.lower().replace("_", " ") in FUNCTION_WORDS
        syns = wn.synsets(key) if key and not is_function_word else []
        e["meaning"] = clean_definition(best_synset(key, syns).definition()) if syns else None
        if syns:
            found += 1
    DATA_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n")
    print(f"added meanings for {found}/{len(entries)} entries")


if __name__ == "__main__":
    main()
