# qurayshe.github.io

A small, static personal site hosted on **GitHub Pages**.

- Hand-written `index.html` + `styles.css` — no framework, no build step.
- A 3D hero (`main.js`) rendered through an **ASCII filter** using
  [Three.js](https://threejs.org/) `AsciiEffect`, loaded from a CDN via an
  ES-module import map. Inspired by the [cline.bot](https://cline.bot) homepage.

## Local preview

It's fully static, but the ES modules need to be served over HTTP (not opened
as a `file://`). Any static server works:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Pushed to the `qurayshe/qurayshe.github.io` repository. Because the repo is named
`<user>.github.io`, GitHub Pages serves it from the default branch root
automatically — live at https://qurayshe.github.io.

The `.nojekyll` file tells Pages to skip Jekyll and serve the files as-is.

## Customize

Edit the copy in `index.html`, the palette in `:root` of `styles.css`, and the
geometry / character ramp in `main.js`.
