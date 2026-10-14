# HAPPY BIRTHDAY SANTRA!!! 🍊

A mobile-first, deliberately goofy birthday site made with plain HTML, CSS and JavaScript.

## 1. Add your images

Use these folders:

- `assets/photos/` — your 50 transparent PNG photos
- `assets/gifs/` — your 5–7 GIFs (silly cats, Kuromi, etc.)

The starter expects these exact photo names:

`santra-01.png` through `santra-50.png`

The starter GIF list is in `script.js` under `GIF_FILES`. Edit those filenames to match your actual files. File names are case-sensitive when hosted online.

Tip: keep PNGs reasonably compressed (ideally around 100–400 KB each) so the site loads smoothly on mobile data. Transparent PNGs work best.

## 2. Preview it

Easiest: open `index.html` in a browser. If your browser blocks local file assets, run a small local server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` on your computer. To test on an Android phone on the same Wi-Fi, use your computer's local network IP instead of `localhost`, e.g. `http://192.168.1.10:8000`.

## 3. Publish and share

Upload the whole folder to a static hosting service such as GitHub Pages, Netlify or Cloudflare Pages. Keep the folder structure intact, then share the public URL.

## How it works

1. A centred pink pixel-art birthday intro.
2. Tap **UNLEASH THE SANTRA** to rain the 50 PNGs down the screen.
3. Tap **OKAY ENOUGH SANTRA** to blast the photos away.
4. Silly GIFs pop in and the final message types itself out.

## Quick customisation

- Change the wording in `index.html` and `script.js`.
- Change pink/orange colours at the top of `style.css` under `:root`.
- For best results on Android, use portrait PNG cut-outs with transparent backgrounds.
- The pixel font is loaded from Google Fonts; if offline, it falls back to Courier New.
