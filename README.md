# uscs_data_science

## Data Science enablement site

`docs/` contains a static, dependency-free site that explains what data science is and
shows how it applies to problems at a cold storage 3PL. It is written for internal,
non-technical users — operations, labor planning, transportation, energy, quality,
commercial, and finance.

```
docs/
├── index.html    # all page content
├── styles.css    # theming, layout, responsive + print styles
├── script.js     # theme toggle, mobile nav, use-case filter, scroll spy
└── .nojekyll     # serve files as-is, skip Jekyll processing
```

No build step, no frameworks, no external requests — it works offline and from any
static host.

### Publish with GitHub Pages

1. Commit and push `docs/` to `main`.
2. In the repository: **Settings → Pages**.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`.
4. Choose branch `main` and folder `/docs`, then **Save**.
5. The site appears at `https://<org-or-user>.github.io/<repo>/` within a minute or two.

To serve from the repo root instead, move the four files out of `docs/` and pick
`/ (root)` in step 4.

### Preview locally

```bash
python3 -m http.server 8000 --directory docs
# then open http://localhost:8000
```

### Editing content

- **Add a use case** — copy an `<article class="case">` block in `index.html`. The
  `data-cat` attribute drives the filter chips (`ops`, `labor`, `transport`, `energy`,
  `inventory`, `commercial`); a card may list more than one. The badge class sets the
  analytics level: `badge-diagnostic`, `badge-predictive`, or `badge-prescriptive`.
- **Add a filter chip** — add a `<button class="chip" data-filter="…">` and use that
  same value in a card's `data-cat`.
- **Rebrand colors** — edit the CSS custom properties in `:root` and
  `html[data-theme="dark"]` at the top of `styles.css`.

The use cases describe problem types the discipline handles well in this industry.
They are illustrative, not published results — replace them with real project outcomes
as they land.
