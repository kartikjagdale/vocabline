# Dutch Vocab Statusline

A Claude Code plugin that rotates an English word, its Dutch translation, a
phonetic pronunciation, and (where available) an English definition in your
terminal status line — e.g.

```
fence → schutting  [skhuting] | a barrier that serves to enclose an area
```

The word changes every ~25 seconds, cycling through ~20,800 Dutch
words/phrases before repeating. Works standalone, or as an extra widget line
inside [ccstatusline](https://github.com/sirmalloc/ccstatusline) if you
already use it.

## Install

From inside Claude Code, in any session:

```
/plugin marketplace add kartikjagdale/dutch-vocab-statusline
/plugin install dutch-vocab-statusline@dutch-vocab-statusline-marketplace
```

Or, from a local clone (no GitHub required):

```
/plugin marketplace add /path/to/dutch-vocab-statusline
/plugin install dutch-vocab-statusline@dutch-vocab-statusline-marketplace
```

Then run the one-time setup command:

```
/dutch-vocab-statusline:setup
```

This detects whether you use `ccstatusline` or a plain `statusLine`, shows
you the exact config change, and writes it after you confirm.

## How it works

- `data/dutch-words.json` — ~300 hand-verified core words/phrases
  (`scripts/seed-words.json`) plus ~20,500 more extracted from the FreeDict
  Dutch-English dictionary (`scripts/extract-freedict.py` —
  see [NOTICE.md](NOTICE.md) for licensing). Phonetic respellings for
  everything are derived uniformly from espeak-ng's Dutch voice
  (`scripts/build-wordlist.js`). English definitions, where WordNet has a
  clean match (~86% of entries), come from `scripts/add-meanings.py`. No
  network or extra tools needed at runtime — this is all baked in once.
- `bin/dutch-word.js` — reads that file and deterministically picks the
  current word from wall-clock time (`floor(now / 25s) % wordlist.length`).
  Fails silently (empty output) rather than leaking an error into the status
  line.
- `SKILL.md` — the `/dutch-vocab-statusline:setup` command that wires the
  script into your status line config.

## Regenerating the word list

Requires `espeak-ng` (`brew install espeak-ng`) and:
`pip install pyglossary beautifulsoup4 wordfreq wordninja nltk`, plus the
FreeDict `nld-eng` StarDict archive from https://freedict.org/downloads/
extracted to `/tmp/nld-eng/`, plus WordNet data
(`python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"`):

```
python3 scripts/extract-freedict.py   # regenerate scripts/freedict-words.json
node scripts/build-wordlist.js        # merge + derive phonetics -> data/dutch-words.json
python3 scripts/add-meanings.py       # add English definitions from WordNet
```
