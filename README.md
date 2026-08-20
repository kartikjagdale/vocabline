# Vocabline

A Claude Code plugin that rotates an English word, its Dutch translation, a
phonetic pronunciation, and (where available) an English definition in your
terminal status line. For example:

```
thank you → dank je wel  [dahngk-yuh-wehl] | a conversational expression of gratitude
```

The word changes every 35 seconds by default (configurable, see below),
cycling through ~20,800 Dutch words/phrases before repeating. Works
standalone, or as an extra widget line inside
[ccstatusline](https://github.com/sirmalloc/ccstatusline) if you already
use it.

## Install

### Step 1: Add the marketplace

From GitHub:

```
/plugin marketplace add kartikjagdale/vocabline
```

Or from a local clone (no GitHub required):

```
/plugin marketplace add /path/to/vocabline
```

### Step 2: Install the plugin

```
/plugin install vocabline@vocabline-marketplace
```

### Step 3: Run setup

```
/vocabline:setup
```

This detects whether you use `ccstatusline` or a plain `statusLine`, shows
you the exact config change, and writes it after you confirm.

That's it. `data/dutch-words.json` ships prebuilt with the plugin, so
nothing else needs installing or downloading.

## Configuration

Rotation speed defaults to 35 seconds. To change it, run:

```
/vocabline:configure
```

Or edit `~/.config/vocabline/config.json` directly:

```json
{ "intervalSeconds": 15 }
```

<details>
<summary><strong>How it works</strong></summary>

**`data/dutch-words.json`**

The word list itself:

- About 300 hand-verified core words and phrases (`scripts/seed-words.json`)
- Roughly 20,500 more pulled from the FreeDict Dutch-English dictionary
  (`scripts/extract-freedict.py`; see [NOTICE.md](NOTICE.md) for licensing)
- Phonetic respellings for everything, from espeak-ng's Dutch voice
  (`scripts/build-wordlist.js`)
- English definitions, from WordNet, where there's a clean match
  (`scripts/add-meanings.py`, about 86% of entries)

None of this needs network access or extra tools at runtime. It's all baked
in ahead of time.

**`bin/vocabline.js`**

Reads that file and deterministically picks the current word from
wall-clock time:

```
index = floor(now / intervalSeconds) % wordlist.length
```

If anything goes wrong, it fails silently instead of leaking an error into
the status line.

**`skills/setup/SKILL.md`** and **`skills/configure/SKILL.md`**

The `/vocabline:setup` and `/vocabline:configure` commands.

</details>

<details>
<summary><strong>Regenerating the word list (maintainers only)</strong></summary>

`data/dutch-words.json` already ships prebuilt in this repo, so installing
the plugin is enough on its own; you never need anything below this point.
It's only for rebuilding or expanding that file from scratch.

Requirements:

- `espeak-ng`:

  ```
  brew install espeak-ng
  ```

- Python packages:

  ```
  pip install pyglossary beautifulsoup4 wordfreq wordninja nltk
  ```

- The FreeDict `nld-eng` StarDict archive, downloaded from
  [freedict.org/downloads](https://freedict.org/downloads/) and extracted
  to `/tmp/nld-eng/`

- WordNet data:

  ```
  python3 -c "import nltk; nltk.download('wordnet'); nltk.download('omw-1.4')"
  ```

Then run, in order:

```
python3 scripts/extract-freedict.py   # regenerate scripts/freedict-words.json
node scripts/build-wordlist.js        # merge + derive phonetics -> data/dutch-words.json
python3 scripts/add-meanings.py       # add English definitions from WordNet
```

</details>
