# Zone Digital

Landing page for **Zone Digital** — Books, Apps & Courses for the AI-Powered Professional by Brian Pajares.

Live at: [www.zone-digital.com](https://www.zone-digital.com)

## Stack

- Vanilla HTML/CSS + React 18 (loaded via CDN, no build step required)
- Babel Standalone for JSX in-browser compilation
- Deployed on Netlify with custom domain

## Structure

```
index.html              # Entry point
zone-digital/
  tokens.css            # Design tokens (colors, type, spacing)
  styles.css            # Full site styles (imports tokens.css)
  data.js               # Book catalog (27 titles with ASINs and links)
  components.jsx        # Shared atoms: Logo, Button, BookCover, Icon, Reveal
  sections-top.jsx      # Header, Hero, Strip, Books catalog
  sections-bottom.jsx   # Courses & Apps, About Brian, Newsletter, Footer
  app.jsx               # LeadModal, ExitIntent, App root
netlify.toml            # Netlify deploy config
```

## Updating the catalog

Edit `zone-digital/data.js` — add a new object to the `BOOKS` array following the existing pattern. The page re-renders automatically on reload.

## Local preview

Just open `index.html` in a browser (or serve with any static file server):

```bash
npx serve .
```
