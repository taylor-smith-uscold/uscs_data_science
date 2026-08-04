# uscs_data_science

## Data science guide

`docs/` holds a static, dependency-free site explaining what data science is and the
kinds of problems it addresses at United States Cold Storage. It is written for internal
readers who know the business well and have no particular reason to know how modeling
works.

The site is a **routed reader**, not a scrolling page: one section is visible at a time,
selected from the left rail, with hash-based routing so every section is linkable.

```
docs/
├── index.html            # all content, all seven sections
├── styles.css            # tokens, layout, responsive + print styles
├── script.js             # routing, on-page contents, pager, search, theme
├── uscs_shield.png       # company mark; used as a CSS mask, not an image
├── favicon-32.png        # \
├── favicon-64.png        #  } generated — see tools/make_icons.py
├── apple-touch-icon.png  # /   also shown beside the section 00 title
└── .nojekyll             # serve files as-is, skip Jekyll processing
tools/
└── make_icons.py         # rebuilds the three icons from uscs_shield.png
```

No build step, no frameworks, no external requests. It works offline and from any static
host.

### Sections

| # | id | Title |
|---|----|-------|
| 00 | `overview` | About this guide |
| 01 | `what` | What data science is |
| 02 | `how` | How a project runs |
| 03 | `maturity` | Four levels of analytics |
| 04 | `problems` | Kinds of problems — 13 problem types across five families |
| 05 | `engage` | Bringing us a problem |
| 06 | `glossary` | Glossary — 14 terms |

Section numbers are derived from DOM order at runtime, but the rail numerals
(`.mod-n`) and the per-section eyebrow (`.eyebrow .num`) are hardcoded. Adding or
reordering a section means updating both, plus the section count in the top-bar
`.brand`.

### Publish with GitHub Pages

1. Push `docs/` to `main`.
2. In the repository: **Settings → Pages**.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`.
4. Choose branch `main` and folder `/docs`, then **Save**.
5. The site appears at `https://<org-or-user>.github.io/<repo>/` within a minute or two.

### Preview locally

```bash
python3 -m http.server 8000 --directory docs
# then open http://localhost:8000
```

Opening `index.html` from the filesystem also works — `history.pushState` fails on
`file://` in some browsers, and the code falls back to setting the hash directly.

### How it behaves

- **Routing** — every `<section class="mdoc">` is a page. `script.js` shows one and
  hides the rest, drives the rail highlight, builds the prev/next pager, and sets
  `document.title`. Section ids are the URL fragments.
- **On-page contents** — built from `h2[id]`/`h3[id]` within the visible section, with a
  scroll spy. Sections with fewer than two headings get no contents panel.
- **Search** — the index is built from the DOM at load, covering every section including
  hidden ones. Press <kbd>/</kbd> to focus, <kbd>Esc</kbd> to dismiss.
- **Theme** — follows the OS preference, overridable by the toggle, persisted to
  `localStorage`.
- **Without JavaScript** — a `<noscript>` block renders all sections stacked and hides
  the search box, contents, and pager, so the content stays readable.
- **Print** — every section prints, one per page, with chrome suppressed.

### Editing content

- **Add a section** — copy a `<section class="mdoc" id="…" data-title="…" hidden>` block,
  add the matching `<a class="mod" data-doc="…">` to the rail, then fix the numerals as
  described under *Sections* above. Add `wide` to the class to drop the 70ch reading
  measure, which section 04 uses for its card grid.
- **Add a problem type** — copy an `<article class="card">` in section 04. The `.lvl`
  badge names the output shape and takes `lvl-p` (predictive), `lvl-x` (prescriptive), or
  `lvl-d` (structure-finding); `.fn` names the family. Keep the *Watch for* row — it is
  what stops the section reading as a list of capabilities.
- **Rebrand colors** — edit the custom properties in `:root` and
  `html[data-theme="dark"]` at the top of `styles.css`. `--tech` is the primary accent
  and `--plain` the secondary.
- **Change the icons** — edit `PLATE_LIGHT` in `tools/make_icons.py` and run
  `python3 tools/make_icons.py docs`. It regenerates all three icons deterministically,
  using only the standard library. The current plate is the guide's own accent, not an
  official USCS brand color.

### On the examples

Section 04 illustrates where each method tends to apply in a temperature-controlled
operation. These are **not** descriptions of completed USCS work, and no throughput,
savings, or accuracy figures are claimed anywhere in the guide. Replace them with real
project outcomes as they land, and keep the disclaimer at the end of section 04 accurate
if you do.

### Design origin

The visual language — monospace chrome over oldstyle serif prose, the slate palette with
petrol and violet accents, hairline rules instead of shadows, and the error-bar "whisker"
rule on `<hr>` — is adapted from a course-reader template. That reference file is
gitignored: it is 704&nbsp;KB and sits in the publish directory, so committing it would
serve it publicly.
