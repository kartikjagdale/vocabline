# Third-party data notice

`data/dutch-words.json` is built in part from the **FreeDict Dutch-English
dictionary** (`nld-eng`, version 0.2, 22,747 headwords), generated from the
Ergane database as part of the [FreeDict project](https://freedict.org).

That dictionary is Copyright (C) 1999-2017 by its various authors, and is
distributed under the **GNU General Public License, version 2 or later**
(https://www.gnu.org/licenses/gpl-2.0.html). It is used here, unmodified in
license terms, to derive English glosses for Dutch headwords; see
`scripts/extract-freedict.py` for exactly how.

This plugin's own code (everything outside `data/dutch-words.json`'s
FreeDict-derived entries) remains MIT-licensed — see `plugin.json`. The
compiled word data that traces back to FreeDict carries the GPL-2.0-or-later
terms above; if you redistribute or modify `data/dutch-words.json`, retain
this notice.

Dutch pronunciation respellings in `data/dutch-words.json` are derived
independently via [espeak-ng](https://github.com/espeak-ng/espeak-ng)
(GPL-3.0), not from FreeDict.
